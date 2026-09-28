from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Course
from app.models.gamification import GameAttempt
from app.schemas.game import (
    GameCompleteRequest,
    GameCompleteResponse,
    GameDetailResponse,
    GameHistoryItem,
    GameListItem,
    GameStartRequest,
    GameStatsResponse,
)
from app.services import enrollment_service
from app.services.game_content import (
    GAMES_METADATA,
    get_game_content_for_session,
    validate_answers_on_server,
)
from app.services.gamification_service import (
    award_xp,
    get_or_create_user_gamification,
    record_activity_and_streak,
    unlock_achievement,
    update_quest_progress,
)

CANONICAL_GAME_IDS = [
    "quiz-rush",
    "memory-match",
    "code-challenge",
    "word-scramble",
    "speed-recall",
]


def _get_game_meta(game_id: str) -> dict[str, Any]:
    for game in GAMES_METADATA:
        if game["id"] == game_id:
            return game
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Game '{game_id}' not found.",
    )


def get_games_list(db: Session, user_id: int) -> list[GameListItem]:
    """Retrieve list of Play & Learn games with user's personal high scores and attempts."""
    stats_query = (
        select(
            GameAttempt.game_id,
            func.max(GameAttempt.score).label("high_score"),
            func.count(GameAttempt.id).label("total_played"),
        )
        .where(
            GameAttempt.user_id == user_id,
            GameAttempt.status.in_(["COMPLETED", "completed"]),
        )
        .group_by(GameAttempt.game_id)
    )
    results = db.execute(stats_query).all()
    stats_map = {row.game_id: (row.high_score or 0, row.total_played or 0) for row in results}

    games: list[GameListItem] = []
    for meta in GAMES_METADATA:
        if meta["id"] not in CANONICAL_GAME_IDS:
            continue
        high_score, total_played = stats_map.get(meta["id"], (0, 0))
        games.append(
            GameListItem(
                id=meta["id"],
                title=meta["title"],
                subtitle=meta["subtitle"],
                description=meta["description"],
                icon=meta["icon"],
                color=meta["color"],
                badge=meta["badge"],
                estimated_time=meta["estimated_time"],
                xp_reward=meta["xp_reward"],
                high_score=high_score,
                total_played=total_played,
            )
        )
    return games


def start_game_session(
    db: Session,
    user_id: int,
    game_id: str,
    payload: GameStartRequest,
) -> GameDetailResponse:
    """Initialize a verified game session, ensuring enrollment if course_id is provided."""
    meta = _get_game_meta(game_id)
    course_title: str | None = None

    if payload.course_id:
        # Enforce that student is actively enrolled
        enrollment_service.require_enrollment(db, user_id, payload.course_id)
        course = enrollment_service.get_published_course(db, payload.course_id)
        course_title = course.title

    session_token = f"game_sess_{uuid.uuid4().hex}"
    now = datetime.now(timezone.utc)

    # Create an initial in-progress GameAttempt record
    attempt = GameAttempt(
        user_id=user_id,
        game_id=game_id,
        course_id=payload.course_id,
        lesson_id=payload.lesson_id,
        session_token=session_token,
        status="IN_PROGRESS",
        score=0,
        accuracy=0.0,
        time_spent_seconds=0,
        xp_awarded=0,
        started_at=now,
    )
    db.add(attempt)
    db.commit()

    content = get_game_content_for_session(game_id, course_title)

    return GameDetailResponse(
        id=meta["id"],
        title=meta["title"],
        subtitle=meta["subtitle"],
        description=meta["description"],
        instructions=meta["instructions"],
        xp_reward=meta["xp_reward"],
        session_token=session_token,
        course_id=payload.course_id,
        course_title=course_title,
        content=content,
    )


def get_game_detail(db: Session, user_id: int, game_id: str) -> GameDetailResponse:
    """Backward compatibility: retrieve game config and a new session."""
    return start_game_session(db, user_id, game_id, GameStartRequest())


def complete_game(
    db: Session,
    user_id: int,
    game_id: str,
    payload: GameCompleteRequest,
) -> GameCompleteResponse:
    """
    Validate answers server-side, record completion, and award idempotent XP.
    Course and lesson progress are strictly preserved and untouched.
    """
    meta = _get_game_meta(game_id)
    gam = get_or_create_user_gamification(db, user_id)

    if payload.course_id:
        enrollment_service.require_enrollment(db, user_id, payload.course_id)

    # 1. Check idempotency: has this session already completed?
    existing_attempt = db.scalar(
        select(GameAttempt).where(
            GameAttempt.user_id == user_id,
            GameAttempt.session_token == payload.session_token,
        )
    )

    prev_high = (
        db.scalar(
            select(func.max(GameAttempt.score)).where(
                GameAttempt.user_id == user_id,
                GameAttempt.game_id == game_id,
                GameAttempt.status.in_(["COMPLETED", "completed"]),
            )
        )
        or 0
    )

    if existing_attempt is not None and existing_attempt.status in ("COMPLETED", "completed"):
        # Already completed: return existing result without awarding XP
        return GameCompleteResponse(
            success=True,
            game_id=game_id,
            score=existing_attempt.score,
            accuracy=existing_attempt.accuracy,
            questions_count=existing_attempt.questions_count,
            correct_count=existing_attempt.correct_count,
            time_spent_seconds=existing_attempt.time_spent_seconds,
            xp_awarded=0,
            total_xp=gam.total_xp,
            current_level=gam.current_level,
            is_new_high_score=False,
            high_score=prev_high,
            unlocked_achievements=[],
        )

    # 2. Server-side validation of answers (tamper-proof)
    score, accuracy, questions_count, correct_count = validate_answers_on_server(
        game_id, payload.model_dump()
    )

    # 3. Scaled XP reward calculation based on performance
    base_xp = meta["xp_reward"]
    if accuracy >= 80.0:
        xp_to_award = base_xp
    elif accuracy >= 50.0:
        xp_to_award = max(15, int(base_xp * 0.75))
    elif score > 0:
        xp_to_award = max(10, int(base_xp * 0.4))
    else:
        xp_to_award = 5

    # 4. Award XP idempotently via reference key
    ref_key = f"game_reward:{game_id}:{user_id}:{payload.session_token}"
    award_ok = award_xp(
        db=db,
        user_id=user_id,
        xp_amount=xp_to_award,
        event_type="GAME_COMPLETED",
        reference_key=ref_key,
        description=f"Completed {meta['title']} (Score: {score})",
    )
    final_xp = xp_to_award if award_ok else 0

    # 5. Record daily learning activity & streak
    record_activity_and_streak(db, user_id)

    # 6. Update Quests
    update_quest_progress(db, user_id, "daily_game", 1)
    update_quest_progress(db, user_id, "weekly_games", 1)

    # 7. Check & unlock achievements
    unlocked_achievements: list[str] = []
    if unlock_achievement(db, user_id, "FIRST_GAME"):
        unlocked_achievements.append("FIRST_GAME")

    completed_count = (
        db.scalar(
            select(func.count(GameAttempt.id)).where(
                GameAttempt.user_id == user_id,
                GameAttempt.status.in_(["COMPLETED", "completed"]),
            )
        )
        or 0
    )
    if completed_count + 1 >= 5:
        if unlock_achievement(db, user_id, "GAME_MASTER"):
            unlocked_achievements.append("GAME_MASTER")

    if accuracy >= 90.0:
        if unlock_achievement(db, user_id, "HIGH_SCORER"):
            unlocked_achievements.append("HIGH_SCORER")

    if game_id in ("speed-recall", "speed-quiz") and accuracy >= 100.0:
        if unlock_achievement(db, user_id, "SPEED_DEMON"):
            unlocked_achievements.append("SPEED_DEMON")

    # 8. Update or persist GameAttempt
    now = datetime.now(timezone.utc)
    is_new_high = score > prev_high
    new_high = max(score, prev_high)

    if existing_attempt is not None:
        existing_attempt.status = "COMPLETED"
        existing_attempt.score = score
        existing_attempt.accuracy = accuracy
        existing_attempt.questions_count = questions_count
        existing_attempt.correct_count = correct_count
        existing_attempt.time_spent_seconds = payload.time_spent_seconds
        existing_attempt.xp_awarded = final_xp
        existing_attempt.completed_at = now
        if payload.course_id:
            existing_attempt.course_id = payload.course_id
        if payload.lesson_id:
            existing_attempt.lesson_id = payload.lesson_id
        db.commit()
    else:
        attempt = GameAttempt(
            user_id=user_id,
            game_id=game_id,
            course_id=payload.course_id,
            lesson_id=payload.lesson_id,
            session_token=payload.session_token,
            status="COMPLETED",
            score=score,
            accuracy=accuracy,
            questions_count=questions_count,
            correct_count=correct_count,
            time_spent_seconds=payload.time_spent_seconds,
            xp_awarded=final_xp,
            started_at=now,
            completed_at=now,
        )
        db.add(attempt)
        db.commit()

    db.refresh(gam)

    return GameCompleteResponse(
        success=True,
        game_id=game_id,
        score=score,
        accuracy=accuracy,
        questions_count=questions_count,
        correct_count=correct_count,
        time_spent_seconds=payload.time_spent_seconds,
        xp_awarded=final_xp,
        total_xp=gam.total_xp,
        current_level=gam.current_level,
        is_new_high_score=is_new_high,
        high_score=new_high,
        unlocked_achievements=unlocked_achievements,
    )


def get_game_stats(db: Session, user_id: int) -> GameStatsResponse:
    """Retrieve cumulative statistics across all Play & Learn games for the user."""
    games_played = (
        db.scalar(
            select(func.count(GameAttempt.id)).where(
                GameAttempt.user_id == user_id,
                GameAttempt.status.in_(["COMPLETED", "completed"]),
            )
        )
        or 0
    )

    best_score = (
        db.scalar(
            select(func.max(GameAttempt.score)).where(
                GameAttempt.user_id == user_id,
                GameAttempt.status.in_(["COMPLETED", "completed"]),
            )
        )
        or 0
    )

    total_game_xp = (
        db.scalar(
            select(func.sum(GameAttempt.xp_awarded)).where(
                GameAttempt.user_id == user_id,
                GameAttempt.status.in_(["COMPLETED", "completed"]),
            )
        )
        or 0
    )

    results = db.execute(
        select(GameAttempt.game_id, func.count(GameAttempt.id))
        .where(
            GameAttempt.user_id == user_id,
            GameAttempt.status.in_(["COMPLETED", "completed"]),
        )
        .group_by(GameAttempt.game_id)
    ).all()
    plays_by_game = {row[0]: row[1] for row in results}

    return GameStatsResponse(
        games_played=games_played,
        best_score=best_score,
        total_game_xp=int(total_game_xp),
        plays_by_game=plays_by_game,
    )


def get_game_history(db: Session, user_id: int, limit: int = 20) -> list[GameHistoryItem]:
    """Retrieve the user's recent completed game attempts."""
    query = (
        select(GameAttempt, Course.title.label("course_title"))
        .outerjoin(Course, GameAttempt.course_id == Course.id)
        .where(
            GameAttempt.user_id == user_id,
            GameAttempt.status.in_(["COMPLETED", "completed"]),
        )
        .order_by(GameAttempt.created_at.desc())
        .limit(limit)
    )
    rows = db.execute(query).all()

    game_title_map = {g["id"]: g["title"] for g in GAMES_METADATA}
    history: list[GameHistoryItem] = []
    for attempt, course_title in rows:
        title = game_title_map.get(attempt.game_id, attempt.game_id.replace("-", " ").title())
        history.append(
            GameHistoryItem(
                id=attempt.id,
                game_id=attempt.game_id,
                game_title=title,
                course_id=attempt.course_id,
                course_title=course_title,
                score=attempt.score,
                accuracy=attempt.accuracy,
                time_spent_seconds=attempt.time_spent_seconds,
                xp_awarded=attempt.xp_awarded,
                created_at=attempt.created_at,
            )
        )
    return history
