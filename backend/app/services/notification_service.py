from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.models.course import Course
from app.models.gamification import GameAttempt, UserAchievement
from app.models.lesson import Lesson
from app.models.lesson_progress import LessonProgress
from app.models.module import Module
from app.models.notification import Notification
from app.models.quiz import Quiz
from app.models.quiz_attempt import QuizAttempt
from app.models.study_plan import StudyPlanTask, TaskStatus
from app.schemas.notification import NotificationItem, NotificationsResponse
from app.services.gamification_service import ACHIEVEMENT_DEFINITIONS


def sync_user_notifications(db: Session, user_id: int) -> None:
    """Sync real student learning events into notifications idempotently."""
    existing_refs = set(
        db.scalars(
            select(Notification.reference_key).where(Notification.user_id == user_id)
        ).all()
    )

    new_notifications: list[Notification] = []

    # 1. Real completed lessons (recent 8)
    recent_lessons = (
        db.execute(
            select(LessonProgress, Lesson, Module, Course)
            .join(Lesson, LessonProgress.lesson_id == Lesson.id)
            .join(Module, Lesson.module_id == Module.id)
            .join(Course, Module.course_id == Course.id)
            .where(
                LessonProgress.student_id == user_id,
                LessonProgress.completed.is_(True),
            )
            .order_by(LessonProgress.completed_at.desc().nulls_last())
            .limit(8)
        )
        .all()
    )

    for lp, lesson, module, course in recent_lessons:
        ref_key = f"lesson_completed:{lp.lesson_id}"
        if ref_key not in existing_refs:
            existing_refs.add(ref_key)
            new_notifications.append(
                Notification(
                    user_id=user_id,
                    category="LESSON",
                    reference_key=ref_key,
                    title="Lesson Completed",
                    message=f"You completed '{lesson.title}' in {course.title}.",
                    link_url=f"/courses/{course.id}/lessons/{lesson.id}",
                    is_read=False,
                    created_at=lp.completed_at or datetime.now(timezone.utc),
                )
            )

    # 2. Real completed quizzes (recent 6)
    recent_quizzes = (
        db.execute(
            select(QuizAttempt, Quiz, Course)
            .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
            .join(Lesson, Quiz.lesson_id == Lesson.id)
            .join(Module, Lesson.module_id == Module.id)
            .join(Course, Module.course_id == Course.id)
            .where(
                QuizAttempt.student_id == user_id,
                QuizAttempt.completed_at.is_not(None),
            )
            .order_by(QuizAttempt.completed_at.desc())
            .limit(6)
        )
        .all()
    )

    for qa, quiz, course in recent_quizzes:
        ref_key = f"quiz_completed:{qa.id}"
        if ref_key not in existing_refs:
            existing_refs.add(ref_key)
            score_pct = round(qa.percentage)
            new_notifications.append(
                Notification(
                    user_id=user_id,
                    category="QUIZ",
                    reference_key=ref_key,
                    title="Quiz Completed",
                    message=f"Scored {score_pct}% on '{quiz.title}' ({course.title}).",
                    link_url=f"/student/quiz/{quiz.id}/result/{qa.id}",
                    is_read=False,
                    created_at=qa.completed_at or datetime.now(timezone.utc),
                )
            )

    # 3. Real unlocked achievements
    achievements = db.scalars(
        select(UserAchievement)
        .where(UserAchievement.user_id == user_id)
        .order_by(UserAchievement.unlocked_at.desc())
    ).all()

    for ach in achievements:
        ref_key = f"achievement:{ach.achievement_id}"
        if ref_key not in existing_refs:
            existing_refs.add(ref_key)
            adef = ACHIEVEMENT_DEFINITIONS.get(ach.achievement_id, {
                "title": ach.achievement_id.replace("_", " ").title(),
                "description": "Achievement unlocked!",
            })
            new_notifications.append(
                Notification(
                    user_id=user_id,
                    category="ACHIEVEMENT",
                    reference_key=ref_key,
                    title="Achievement Unlocked!",
                    message=f"You earned '{adef['title']}': {adef['description']}",
                    link_url="/student",
                    is_read=False,
                    created_at=ach.unlocked_at,
                )
            )

    # 4. Real pending/due study plan tasks (recent 4)
    tasks = db.scalars(
        select(StudyPlanTask)
        .where(
            StudyPlanTask.student_id == user_id,
            StudyPlanTask.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
        )
        .order_by(StudyPlanTask.scheduled_date.asc())
        .limit(4)
    ).all()

    for task in tasks:
        ref_key = f"study_task_due:{task.id}"
        if ref_key not in existing_refs:
            existing_refs.add(ref_key)
            due_str = f" scheduled {task.scheduled_date.strftime('%b %d')}" if task.scheduled_date else ""
            new_notifications.append(
                Notification(
                    user_id=user_id,
                    category="STUDY_PLAN",
                    reference_key=ref_key,
                    title="Study Plan Target",
                    message=f"Upcoming study milestone: '{task.title}'{due_str}.",
                    link_url="/student/study-plan",
                    is_read=False,
                    created_at=task.created_at,
                )
            )

    if new_notifications:
        db.add_all(new_notifications)
        db.commit()


def get_user_notifications(db: Session, user_id: int, limit: int = 25) -> NotificationsResponse:
    """Retrieve in-app notifications with unread count for current user."""
    sync_user_notifications(db, user_id)

    notifications = list(
        db.scalars(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        ).all()
    )

    unread_count = db.scalar(
        select(func.count(Notification.id)).where(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
        )
    ) or 0

    return NotificationsResponse(
        unread_count=unread_count,
        items=[NotificationItem.model_validate(n) for n in notifications],
    )


def mark_notification_as_read(db: Session, user_id: int, notification_id: int) -> bool:
    """Mark a single notification as read if owned by current user."""
    stmt = (
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == user_id)
        .values(is_read=True)
    )
    result = db.execute(stmt)
    db.commit()
    return (result.rowcount or 0) > 0


def mark_all_notifications_as_read(db: Session, user_id: int) -> int:
    """Mark all notifications as read for current user."""
    stmt = (
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read.is_(False))
        .values(is_read=True)
    )
    result = db.execute(stmt)
    db.commit()
    return result.rowcount or 0
