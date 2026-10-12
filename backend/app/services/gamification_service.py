import calendar
from datetime import date, datetime, time, timedelta, timezone
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.gamification import (
    GameAttempt,
    GamificationLog,
    UserAchievement,
    UserGamification,
    UserQuestProgress,
)
from app.models.course import Course
from app.models.quiz import Quiz
from app.models.lesson_progress import LessonProgress
from app.models.quiz_attempt import QuizAttempt
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.module import Module
from app.schemas.gamification import (
    AchievementItemResponse,
    DayActivityEvent,
    DayActivitySummary,
    GamificationActivityLogResponse,
    LevelDetailsResponse,
    LevelProgressInfo,
    LevelTierItem,
    MonthlyActivityResponse,
    QuestItemResponse,
    StreakActivityItem,
    StreakDetailsResponse,
    StreakInfo,
    StudentGamificationResponse,
    XpSummaryResponse,
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


LEVEL_TITLES = {
    1: "Novice Learner",
    2: "Curious Explorer",
    3: "Active Student",
    4: "Dedicated Scholar",
    5: "Master Scholar",
    6: "Knowledge Seeker",
    7: "Expert Learner",
    8: "Grand Scholar",
    9: "Platform Luminary",
    10: "Grandmaster",
}


def get_streak_details(db: Session, student_id: int) -> StreakDetailsResponse:
    """Return comprehensive streak metrics and recent daily learning activity."""
    gam = get_or_create_user_gamification(db, student_id)
    today = date.today()
    is_active_today = (gam.last_activity_date == today)

    if is_active_today:
        today_msg = "Streak active today! Great dedication."
    elif gam.current_streak > 0:
        today_msg = "Complete one learning activity today to keep your streak going."
    else:
        today_msg = "Complete your first lesson, quiz, or game today to start a streak!"

    fourteen_days_ago = today - timedelta(days=14)
    fourteen_days_ago_dt = datetime.combine(fourteen_days_ago, datetime.min.time(), tzinfo=timezone.utc)

    # Completed lessons in past 14 days
    completed_lessons = (
        db.execute(
            select(LessonProgress, Lesson, Module, Course)
            .join(Lesson, LessonProgress.lesson_id == Lesson.id)
            .join(Module, Lesson.module_id == Module.id)
            .join(Course, Module.course_id == Course.id)
            .where(
                LessonProgress.student_id == student_id,
                LessonProgress.completed.is_(True),
                LessonProgress.completed_at >= fourteen_days_ago_dt,
            )
            .order_by(LessonProgress.completed_at.desc().nulls_last())
        )
        .all()
    )

    # Completed quizzes in past 14 days
    completed_quizzes = (
        db.execute(
            select(QuizAttempt, Quiz, Course)
            .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
            .join(Lesson, Quiz.lesson_id == Lesson.id)
            .join(Module, Lesson.module_id == Module.id)
            .join(Course, Module.course_id == Course.id)
            .where(
                QuizAttempt.student_id == student_id,
                QuizAttempt.completed_at.is_not(None),
                QuizAttempt.completed_at >= fourteen_days_ago_dt,
            )
            .order_by(QuizAttempt.completed_at.desc())
        )
        .all()
    )

    # Completed games in past 14 days
    completed_games = list(
        db.scalars(
            select(GameAttempt).where(
                GameAttempt.user_id == student_id,
                GameAttempt.completed_at.is_not(None),
                GameAttempt.completed_at >= fourteen_days_ago_dt,
            ).order_by(GameAttempt.completed_at.desc())
        ).all()
    )

    active_dates: set[date] = set()
    if is_active_today:
        active_dates.add(today)
    if gam.last_activity_date and gam.last_activity_date >= fourteen_days_ago:
        active_dates.add(gam.last_activity_date)

    recent_activities: list[StreakActivityItem] = []

    for lp, lesson, module, course in completed_lessons:
        comp_date = lp.completed_at.date() if lp.completed_at else today
        active_dates.add(comp_date)
        recent_activities.append(
            StreakActivityItem(
                id=f"lesson-{lp.id}",
                activity_type="LESSON",
                title=lesson.title,
                course_title=course.title,
                completed_at=lp.completed_at or datetime.now(timezone.utc),
                xp_earned=50,
            )
        )

    for qa, quiz, course in completed_quizzes:
        comp_date = qa.completed_at.date() if qa.completed_at else today
        active_dates.add(comp_date)
        recent_activities.append(
            StreakActivityItem(
                id=f"quiz-{qa.id}",
                activity_type="QUIZ",
                title=quiz.title,
                course_title=course.title,
                completed_at=qa.completed_at or datetime.now(timezone.utc),
                xp_earned=75,
            )
        )

    for ga in completed_games:
        comp_date = ga.completed_at.date() if ga.completed_at else today
        active_dates.add(comp_date)
        recent_activities.append(
            StreakActivityItem(
                id=f"game-{ga.id}",
                activity_type="GAME",
                title=ga.game_id.replace("_", " ").title(),
                course_title="Play & Learn",
                completed_at=ga.completed_at or datetime.now(timezone.utc),
                xp_earned=ga.xp_awarded,
            )
        )

    recent_activities.sort(key=lambda x: x.completed_at, reverse=True)
    sorted_dates = sorted(list(active_dates), reverse=True)

    return StreakDetailsResponse(
        current_streak=gam.current_streak,
        longest_streak=gam.longest_streak,
        last_activity_date=gam.last_activity_date,
        is_active_today=is_active_today,
        today_status_message=today_msg,
        active_dates_past_14=sorted_dates,
        contributing_lessons_count=len(completed_lessons),
        contributing_quizzes_count=len(completed_quizzes),
        recent_activities=recent_activities[:15],
    )


def get_xp_summary(db: Session, student_id: int) -> XpSummaryResponse:
    """Return detailed XP statistics, weekly/daily breakdown, and gamification log history."""
    gam = get_or_create_user_gamification(db, student_id)
    level_info = calculate_level(gam.total_xp)

    today = date.today()
    today_start = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
    monday = today - timedelta(days=today.weekday())
    week_start = datetime.combine(monday, datetime.min.time(), tzinfo=timezone.utc)

    xp_today = db.scalar(
        select(func.coalesce(func.sum(GamificationLog.xp_earned), 0)).where(
            GamificationLog.user_id == student_id,
            GamificationLog.created_at >= today_start,
        )
    ) or 0

    xp_this_week = db.scalar(
        select(func.coalesce(func.sum(GamificationLog.xp_earned), 0)).where(
            GamificationLog.user_id == student_id,
            GamificationLog.created_at >= week_start,
        )
    ) or 0

    logs = list(
        db.scalars(
            select(GamificationLog)
            .where(GamificationLog.user_id == student_id)
            .order_by(GamificationLog.created_at.desc())
            .limit(30)
        ).all()
    )

    xp_remaining = max(0, level_info.xp_required_for_next_level - level_info.xp_into_level)

    return XpSummaryResponse(
        total_xp=gam.total_xp,
        current_level=level_info.current_level,
        xp_earned_today=int(xp_today),
        xp_earned_this_week=int(xp_this_week),
        xp_into_level=level_info.xp_into_level,
        xp_required_for_next_level=level_info.xp_required_for_next_level,
        xp_remaining_to_next_level=xp_remaining,
        progress_percentage=level_info.progress_percentage,
        recent_history=[GamificationActivityLogResponse.model_validate(log) for log in logs],
    )


def get_level_details(db: Session, student_id: int) -> LevelDetailsResponse:
    """Return full level progression roadmap with current standing and thresholds."""
    gam = get_or_create_user_gamification(db, student_id)
    level_info = calculate_level(gam.total_xp)

    max_display_level = max(6, level_info.current_level + 2)
    timeline: list[LevelTierItem] = []

    for lvl in range(1, max_display_level + 1):
        timeline.append(
            LevelTierItem(
                level=lvl,
                title=LEVEL_TITLES.get(lvl, f"Level {lvl} Scholar"),
                xp_threshold=_get_level_threshold(lvl),
                is_unlocked=(lvl <= level_info.current_level),
                is_current=(lvl == level_info.current_level),
            )
        )

    xp_remaining = max(0, level_info.xp_required_for_next_level - level_info.xp_into_level)

    return LevelDetailsResponse(
        current_level=level_info.current_level,
        total_xp=gam.total_xp,
        xp_into_level=level_info.xp_into_level,
        xp_required_for_next_level=level_info.xp_required_for_next_level,
        xp_remaining_to_next_level=xp_remaining,
        progress_percentage=level_info.progress_percentage,
        next_level=level_info.current_level + 1,
        levels_timeline=timeline,
    )


def get_monthly_activity(
    db: Session,
    student_id: int,
    year: int | None = None,
    month: int | None = None,
) -> MonthlyActivityResponse:
    """Return calendar activity for a specific student, year, and month."""
    today = date.today()
    if year is None:
        year = today.year
    if month is None:
        month = today.month

    # Clamp/validate month
    month = max(1, min(12, int(month)))
    year = int(year)

    num_days = calendar.monthrange(year, month)[1]
    start_date = date(year, month, 1)
    end_date = date(year, month, num_days)
    start_dt = datetime.combine(start_date, time.min, tzinfo=timezone.utc)
    end_dt = datetime.combine(end_date, time.max, tzinfo=timezone.utc)

    # 1. Completed lessons
    completed_lessons = (
        db.execute(
            select(LessonProgress, Lesson, Module, Course)
            .join(Lesson, LessonProgress.lesson_id == Lesson.id)
            .join(Module, Lesson.module_id == Module.id)
            .join(Course, Module.course_id == Course.id)
            .where(
                LessonProgress.student_id == student_id,
                LessonProgress.completed.is_(True),
                LessonProgress.completed_at >= start_dt,
                LessonProgress.completed_at <= end_dt,
            )
        )
        .all()
    )

    # 2. Completed quizzes
    completed_quizzes = (
        db.execute(
            select(QuizAttempt, Quiz, Course)
            .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
            .join(Lesson, Quiz.lesson_id == Lesson.id)
            .join(Module, Lesson.module_id == Module.id)
            .join(Course, Module.course_id == Course.id)
            .where(
                QuizAttempt.student_id == student_id,
                QuizAttempt.completed_at.is_not(None),
                QuizAttempt.completed_at >= start_dt,
                QuizAttempt.completed_at <= end_dt,
            )
        )
        .all()
    )

    # 3. Completed minigames
    completed_games = list(
        db.scalars(
            select(GameAttempt).where(
                GameAttempt.user_id == student_id,
                GameAttempt.completed_at.is_not(None),
                GameAttempt.completed_at >= start_dt,
                GameAttempt.completed_at <= end_dt,
            )
        ).all()
    )

    # 4. XP logs
    xp_logs = list(
        db.scalars(
            select(GamificationLog).where(
                GamificationLog.user_id == student_id,
                GamificationLog.created_at >= start_dt,
                GamificationLog.created_at <= end_dt,
            )
        ).all()
    )

    day_summaries: dict[str, dict] = {}

    def _get_day(d: date) -> dict:
        key = d.strftime("%Y-%m-%d")
        if key not in day_summaries:
            day_summaries[key] = {
                "date": d,
                "activity_count": 0,
                "xp_earned": 0,
                "lessons_completed": 0,
                "quizzes_completed": 0,
                "games_completed": 0,
                "events": [],
            }
        return day_summaries[key]

    for lp, lesson, _module, course in completed_lessons:
        d = lp.completed_at.date() if lp.completed_at else start_date
        day_dict = _get_day(d)
        day_dict["activity_count"] += 1
        day_dict["lessons_completed"] += 1
        day_dict["events"].append(
            DayActivityEvent(
                id=f"lesson-{lp.id}",
                activity_type="LESSON",
                title=lesson.title,
                course_title=course.title,
                xp_earned=50,
                completed_at=lp.completed_at,
            )
        )

    for qa, quiz, course in completed_quizzes:
        d = qa.completed_at.date() if qa.completed_at else start_date
        day_dict = _get_day(d)
        day_dict["activity_count"] += 1
        day_dict["quizzes_completed"] += 1
        day_dict["events"].append(
            DayActivityEvent(
                id=f"quiz-{qa.id}",
                activity_type="QUIZ",
                title=quiz.title,
                course_title=course.title,
                xp_earned=75,
                completed_at=qa.completed_at,
            )
        )

    for ga in completed_games:
        d = ga.completed_at.date() if ga.completed_at else start_date
        day_dict = _get_day(d)
        day_dict["activity_count"] += 1
        day_dict["games_completed"] += 1
        day_dict["events"].append(
            DayActivityEvent(
                id=f"game-{ga.id}",
                activity_type="GAME",
                title=ga.game_id.replace("_", " ").title(),
                course_title="Play & Learn",
                xp_earned=ga.xp_awarded or 0,
                completed_at=ga.completed_at,
            )
        )

    for log in xp_logs:
        d = log.created_at.date() if log.created_at else start_date
        day_dict = _get_day(d)
        day_dict["xp_earned"] += log.xp_earned
        if log.event_type not in ("LESSON_COMPLETED", "QUIZ_PASSED", "GAME_COMPLETED"):
            day_dict["activity_count"] += 1
            day_dict["events"].append(
                DayActivityEvent(
                    id=f"log-{log.id}",
                    activity_type="XP",
                    title=log.description or "XP Earned",
                    xp_earned=log.xp_earned,
                    completed_at=log.created_at,
                )
            )

    # Also synchronize with user's streak activity if in visible month
    gam = get_or_create_user_gamification(db, student_id)
    if gam.last_activity_date and start_date <= gam.last_activity_date <= end_date:
        d = gam.last_activity_date
        day_dict = _get_day(d)
        if day_dict["activity_count"] == 0:
            day_dict["activity_count"] = 1

    # If user has an active streak spanning into this month
    if gam.last_activity_date and gam.current_streak > 0:
        for streak_offset in range(gam.current_streak):
            streak_d = gam.last_activity_date - timedelta(days=streak_offset)
            if start_date <= streak_d <= end_date:
                day_dict = _get_day(streak_d)
                if day_dict["activity_count"] == 0:
                    day_dict["activity_count"] = 1

    # Sort active dates
    active_dates = sorted(
        [v["date"] for v in day_summaries.values() if v["activity_count"] > 0 or v["xp_earned"] > 0]
    )

    days_formatted = {
        k: DayActivitySummary(**v) for k, v in day_summaries.items()
    }

    return MonthlyActivityResponse(
        year=year,
        month=month,
        active_dates=active_dates,
        days=days_formatted,
    )

