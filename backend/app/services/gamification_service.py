from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.gamification import (
    GamificationLog,
    UserAchievement,
    UserGamification,
    UserQuestProgress,
)
from app.models.lesson_progress import LessonProgress
from app.models.quiz_attempt import QuizAttempt
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.module import Module
from app.schemas.gamification import (
    AchievementItemResponse,
    GamificationActivityLogResponse,
    LevelProgressInfo,
    QuestItemResponse,
    StreakInfo,
    StudentGamificationResponse,
)

# Achievement Metadata Definitions
ACHIEVEMENT_DEFINITIONS = {
    "FIRST_LESSON": {
        "title": "First Step",
        "description": "Complete your first lesson",
    },
    "QUIZ_MASTER": {
        "title": "Quiz Master",
        "description": "Complete 10 quizzes",
    },
    "STREAK_7": {
        "title": "7-Day Streak",
        "description": "Maintain a 7-day learning streak",
    },
    "COURSE_COMPLETE": {
        "title": "Graduate",
        "description": "Complete a full course",
    },
    "XP_1000": {
        "title": "Rising Star",
        "description": "Earn 1,000 total XP",
    },
    "XP_5000": {
        "title": "Master Scholar",
        "description": "Earn 5,000 total XP",
    },
    "FIRST_GAME": {
        "title": "Game On",
        "description": "Complete your first study game",
    },
    "GAME_MASTER": {
        "title": "Game Master",
        "description": "Complete 5 study games",
    },
    "HIGH_SCORER": {
        "title": "Sharp Mind",
        "description": "Score 90% or higher in any study game",
    },
    "SPEED_DEMON": {
        "title": "Speed Demon",
        "description": "Complete Speed Recall with 100% accuracy",
    },
}

# Quest Metadata Definitions
QUEST_DEFINITIONS = {
    "daily_lesson": {
        "title": "Complete 1 Lesson",
        "period": "daily",
        "target": 1,
        "xp_reward": 50,
        "scope": "global",
    },
    "daily_quiz": {
        "title": "Finish 1 Quiz",
        "period": "daily",
        "target": 1,
        "xp_reward": 75,
        "scope": "global",
    },
    "daily_ai": {
        "title": "Ask Kitsuno AI a doubt",
        "period": "daily",
        "target": 1,
        "xp_reward": 25,
        "scope": "global",
    },
    "daily_game": {
        "title": "Play 1 Study Game",
        "period": "daily",
        "target": 1,
        "xp_reward": 30,
        "scope": "global",
    },
    "weekly_lessons": {
        "title": "Complete 3 Lessons this week",
        "period": "weekly",
        "target": 3,
        "xp_reward": 200,
        "scope": "global",
    },
    "weekly_quizzes": {
        "title": "Finish 2 Quizzes this week",
        "period": "weekly",
        "target": 2,
        "xp_reward": 150,
        "scope": "global",
    },
    "weekly_games": {
        "title": "Play 3 Study Games this week",
        "period": "weekly",
        "target": 3,
        "xp_reward": 100,
        "scope": "global",
    },
}


def _get_level_threshold(level: int) -> int:
    """Calculate cumulative XP threshold required to reach a given level."""
    if level <= 1:
        return 0
    return 50 * level * (level - 1)


def calculate_level(total_xp: int) -> LevelProgressInfo:
    """Calculate current level, XP into current level, next level requirement & percentage."""
    if total_xp < 0:
        total_xp = 0

    level = 1
    while _get_level_threshold(level + 1) <= total_xp:
        level += 1

    current_threshold = _get_level_threshold(level)
    next_threshold = _get_level_threshold(level + 1)
    xp_into_level = total_xp - current_threshold
    xp_required_for_next = next_threshold - current_threshold
    pct = round((xp_into_level / xp_required_for_next) * 100.0, 1) if xp_required_for_next > 0 else 100.0

    return LevelProgressInfo(
        current_level=level,
        total_xp=total_xp,
        xp_into_level=xp_into_level,
        xp_required_for_next_level=xp_required_for_next,
        progress_percentage=min(100.0, pct),
    )


def get_or_create_user_gamification(db: Session, user_id: int) -> UserGamification:
    """Retrieve or initialize UserGamification record."""
    record = db.scalar(select(UserGamification).where(UserGamification.user_id == user_id))
    if record is None:
        record = UserGamification(
            user_id=user_id,
            total_xp=0,
            current_level=1,
            current_streak=0,
            longest_streak=0,
            last_activity_date=None,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
    return record


def record_activity_and_streak(db: Session, user_id: int, activity_date: date | None = None) -> UserGamification:
    """Update user streak based on consecutive calendar day activities."""
    if activity_date is None:
        activity_date = date.today()

    gam = get_or_create_user_gamification(db, user_id)

    if gam.last_activity_date == activity_date:
        # Same day activity -> streak unchanged
        return gam

    if gam.last_activity_date == activity_date - timedelta(days=1):
        # Consecutive day -> increment streak
        gam.current_streak += 1
    else:
        # Missed day or first activity -> reset streak to 1
        gam.current_streak = 1

    if gam.current_streak > gam.longest_streak:
        gam.longest_streak = gam.current_streak

    gam.last_activity_date = activity_date
    db.commit()
    db.refresh(gam)

    # Check Streak Achievement
    if gam.current_streak >= 7:
        unlock_achievement(db, user_id, "STREAK_7")

    return gam


def award_xp(
    db: Session,
    user_id: int,
    xp_amount: int,
    event_type: str,
    reference_key: str,
    description: str,
) -> bool:
    """Award XP to student if reference_key is idempotent and not previously logged."""
    existing_log = db.scalar(
        select(GamificationLog).where(
            GamificationLog.user_id == user_id,
            GamificationLog.reference_key == reference_key,
        )
    )
    if existing_log is not None:
        # Idempotent match: already awarded
        return False

    gam = get_or_create_user_gamification(db, user_id)
    gam.total_xp += xp_amount
    level_info = calculate_level(gam.total_xp)
    gam.current_level = level_info.current_level

    log_entry = GamificationLog(
        user_id=user_id,
        event_type=event_type,
        reference_key=reference_key,
        xp_earned=xp_amount,
        description=description,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(gam)

    # Check XP Achievements
    if gam.total_xp >= 1000:
        unlock_achievement(db, user_id, "XP_1000")
    if gam.total_xp >= 5000:
        unlock_achievement(db, user_id, "XP_5000")

    return True


def unlock_achievement(db: Session, user_id: int, achievement_id: str) -> bool:
    """Unlock an achievement for user if not already unlocked."""
    if achievement_id not in ACHIEVEMENT_DEFINITIONS:
        return False

    existing = db.scalar(
        select(UserAchievement).where(
            UserAchievement.user_id == user_id,
            UserAchievement.achievement_id == achievement_id,
        )
    )
    if existing is not None:
        return False

    ach = UserAchievement(
        user_id=user_id,
        achievement_id=achievement_id,
        unlocked_at=datetime.now(timezone.utc),
    )
    db.add(ach)
    db.commit()
    return True


def update_quest_progress(db: Session, user_id: int, quest_id: str, increment: int = 1) -> None:
    """Update quest progress for current daily/weekly period key."""
    if quest_id not in QUEST_DEFINITIONS:
        return

    qdef = QUEST_DEFINITIONS[quest_id]
    today = date.today()
    if qdef["period"] == "daily":
        period_key = today.strftime("%Y-%m-%d")
    else:  # weekly
        year, week, _ = today.isocalendar()
        period_key = f"{year}-W{week:02d}"

    qprog = db.scalar(
        select(UserQuestProgress).where(
            UserQuestProgress.user_id == user_id,
            UserQuestProgress.quest_id == quest_id,
            UserQuestProgress.period_key == period_key,
        )
    )

    if qprog is None:
        qprog = UserQuestProgress(
            user_id=user_id,
            quest_id=quest_id,
            period_key=period_key,
            current_count=0,
            target_count=qdef["target"],
            completed=False,
            claimed=False,
        )
        db.add(qprog)
        db.flush()

    if not qprog.completed:
        qprog.current_count += increment
        if qprog.current_count >= qprog.target_count:
            qprog.current_count = qprog.target_count
            qprog.completed = True
            # Award Quest XP
            ref_key = f"quest_reward:{quest_id}:{period_key}"
            award_xp(
                db=db,
                user_id=user_id,
                xp_amount=qdef["xp_reward"],
                event_type="QUEST_COMPLETED",
                reference_key=ref_key,
                description=f"Completed Quest: {qdef['title']}",
            )
    db.commit()


def reset_course_quests(db: Session, user_id: int, course_id: int) -> None:
    """Reset course-specific quests when a student unenrolls from a course.
    Global quests (daily_lesson, daily_quiz, daily_ai, weekly_lessons, weekly_quizzes)
    remain completely intact."""
    from sqlalchemy import delete
    course_prefix = f"course_{course_id}_"
    db.execute(
        delete(UserQuestProgress).where(
            UserQuestProgress.user_id == user_id,
            UserQuestProgress.quest_id.startswith(course_prefix),
        )
    )
    db.commit()


def recalculate_student_quests(db: Session, user_id: int) -> None:
    """Recalculate active daily and weekly quest progress based on authoritative
    completed lessons from actively enrolled courses."""
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
    monday = today - timedelta(days=today.weekday())
    week_start = datetime.combine(monday, datetime.min.time(), tzinfo=timezone.utc)

    # Count today's completed lessons in actively enrolled courses
    daily_count = db.scalar(
        select(func.count(LessonProgress.id))
        .join(Lesson, LessonProgress.lesson_id == Lesson.id)
        .join(Module, Lesson.module_id == Module.id)
        .join(Enrollment, (Enrollment.course_id == Module.course_id) & (Enrollment.student_id == user_id))
        .where(
            LessonProgress.student_id == user_id,
            LessonProgress.completed.is_(True),
            LessonProgress.completed_at >= today_start,
        )
    ) or 0

    # Count this week's completed lessons in actively enrolled courses
    weekly_count = db.scalar(
        select(func.count(LessonProgress.id))
        .join(Lesson, LessonProgress.lesson_id == Lesson.id)
        .join(Module, Lesson.module_id == Module.id)
        .join(Enrollment, (Enrollment.course_id == Module.course_id) & (Enrollment.student_id == user_id))
        .where(
            LessonProgress.student_id == user_id,
            LessonProgress.completed.is_(True),
            LessonProgress.completed_at >= week_start,
        )
    ) or 0

    # Update daily_lesson quest if it exists for today's period_key
    daily_period_key = today.strftime("%Y-%m-%d")
    qprog_daily = db.scalar(
        select(UserQuestProgress).where(
            UserQuestProgress.user_id == user_id,
            UserQuestProgress.quest_id == "daily_lesson",
            UserQuestProgress.period_key == daily_period_key,
        )
    )
    if qprog_daily is not None:
        target = QUEST_DEFINITIONS["daily_lesson"]["target"]
        qprog_daily.current_count = min(daily_count, target)
        qprog_daily.completed = (qprog_daily.current_count >= target)

    # Update weekly_lessons quest if it exists for this week's period_key
    year, week, _ = today.isocalendar()
    weekly_period_key = f"{year}-W{week:02d}"
    qprog_weekly = db.scalar(
        select(UserQuestProgress).where(
            UserQuestProgress.user_id == user_id,
            UserQuestProgress.quest_id == "weekly_lessons",
            UserQuestProgress.period_key == weekly_period_key,
        )
    )
    if qprog_weekly is not None:
        target = QUEST_DEFINITIONS["weekly_lessons"]["target"]
        qprog_weekly.current_count = min(weekly_count, target)
        qprog_weekly.completed = (qprog_weekly.current_count >= target)

    db.commit()


# Event Trigger Handlers called from core domain services

def on_lesson_completed(db: Session, student_id: int, lesson_id: int) -> None:
    """Triggered when a student completes a lesson."""
    record_activity_and_streak(db, student_id)

    # Award 50 XP (Idempotent per student & lesson)
    ref_key = f"lesson_completed:{student_id}:{lesson_id}"
    awarded = award_xp(
        db=db,
        user_id=student_id,
        xp_amount=50,
        event_type="LESSON_COMPLETED",
        reference_key=ref_key,
        description=f"Completed Lesson #{lesson_id}",
    )

    if awarded:
        unlock_achievement(db, student_id, "FIRST_LESSON")
        update_quest_progress(db, student_id, "daily_lesson", 1)
        update_quest_progress(db, student_id, "weekly_lessons", 1)


def on_quiz_completed(db: Session, student_id: int, attempt: QuizAttempt) -> None:
    """Triggered when a student completes a quiz attempt."""
    record_activity_and_streak(db, student_id)

    # Award 75 XP for quiz completion (Idempotent per attempt)
    attempt_ref = f"quiz_attempt:{attempt.id}"
    awarded = award_xp(
        db=db,
        user_id=student_id,
        xp_amount=75,
        event_type="QUIZ_COMPLETED",
        reference_key=attempt_ref,
        description=f"Finished Quiz attempt (Score: {Math_round(attempt.percentage)}%)" if False else f"Finished Quiz attempt ({round(attempt.percentage)}%)",
    )

    if awarded:
        # Check High Score Bonus (+25 XP if >= 80%)
        if attempt.percentage >= 80.0:
            bonus_ref = f"quiz_high_score:{attempt.id}"
            award_xp(
                db=db,
                user_id=student_id,
                xp_amount=25,
                event_type="QUIZ_HIGH_SCORE",
                reference_key=bonus_ref,
                description=f"High score bonus on Quiz ({round(attempt.percentage)}%)",
            )

        update_quest_progress(db, student_id, "daily_quiz", 1)
        update_quest_progress(db, student_id, "weekly_quizzes", 1)

        # Check Quiz Master Achievement (10 completed attempts)
        completed_attempts_count = db.scalar(
            select(func.count(QuizAttempt.id)).where(
                QuizAttempt.student_id == student_id,
                QuizAttempt.completed_at.is_not(None),
            )
        ) or 0

        if completed_attempts_count >= 10:
            unlock_achievement(db, student_id, "QUIZ_MASTER")


def on_course_completed(db: Session, student_id: int, course_id: int) -> None:
    """Triggered when a student completes all lessons in a course."""
    record_activity_and_streak(db, student_id)

    ref_key = f"course_completed:{student_id}:{course_id}"
    awarded = award_xp(
        db=db,
        user_id=student_id,
        xp_amount=150,
        event_type="COURSE_COMPLETED",
        reference_key=ref_key,
        description=f"Completed Course #{course_id}",
    )
    if awarded:
        unlock_achievement(db, student_id, "COURSE_COMPLETE")


def on_ai_interaction(db: Session, student_id: int) -> None:
    """Triggered when a student interacts with Kitsuno AI assistant."""
    record_activity_and_streak(db, student_id)

    today_str = date.today().strftime("%Y-%m-%d")
    ref_key = f"ai_interaction:{student_id}:{today_str}"
    award_xp(
        db=db,
        user_id=student_id,
        xp_amount=10,
        event_type="AI_INTERACTION",
        reference_key=ref_key,
        description="Asked Kitsuno AI a study doubt",
    )
    update_quest_progress(db, student_id, "daily_ai", 1)


def get_student_gamification(db: Session, student_id: int) -> StudentGamificationResponse:
    """Build full student gamification status."""
    recalculate_student_quests(db, student_id)
    gam = get_or_create_user_gamification(db, student_id)
    level_info = calculate_level(gam.total_xp)
    streak_info = StreakInfo(
        current_streak=gam.current_streak,
        longest_streak=gam.longest_streak,
        last_activity_date=gam.last_activity_date,
    )

    # Quests
    today = date.today()
    daily_key = today.strftime("%Y-%m-%d")
    year, week, _ = today.isocalendar()
    weekly_key = f"{year}-W{week:02d}"

    quest_rows = list(
        db.scalars(select(UserQuestProgress).where(UserQuestProgress.user_id == student_id))
    )
    quest_map = {(q.quest_id, q.period_key): q for q in quest_rows}

    quests_response = []
    for qid, qdef in QUEST_DEFINITIONS.items():
        pkey = daily_key if qdef["period"] == "daily" else weekly_key
        qprog = quest_map.get((qid, pkey))
        current_count = qprog.current_count if qprog else 0
        completed = qprog.completed if qprog else False

        quests_response.append(
            QuestItemResponse(
                id=qid,
                title=qdef["title"],
                period=qdef["period"],
                current_count=current_count,
                target_count=qdef["target"],
                xp_reward=qdef["xp_reward"],
                completed=completed,
            )
        )

    # Achievements
    unlocked_ach = list(
        db.scalars(select(UserAchievement).where(UserAchievement.user_id == student_id))
    )
    unlocked_map = {a.achievement_id: a.unlocked_at for a in unlocked_ach}

    achievements_response = []
    for ach_id, adef in ACHIEVEMENT_DEFINITIONS.items():
        is_unlocked = ach_id in unlocked_map
        achievements_response.append(
            AchievementItemResponse(
                id=ach_id,
                title=adef["title"],
                description=adef["description"],
                unlocked=is_unlocked,
                unlocked_at=unlocked_map.get(ach_id),
            )
        )

    # Activity Logs
    logs = list(
        db.scalars(
            select(GamificationLog)
            .where(GamificationLog.user_id == student_id)
            .order_by(GamificationLog.created_at.desc())
            .limit(10)
        )
    )
    activity_response = [
        GamificationActivityLogResponse.model_validate(log) for log in logs
    ]

    return StudentGamificationResponse(
        total_xp=gam.total_xp,
        level_info=level_info,
        streak_info=streak_info,
        quests=quests_response,
        achievements=achievements_response,
        recent_logs=activity_response,
    )
