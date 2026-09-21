from __future__ import annotations

from datetime import datetime

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models import (
    Course,
    Enrollment,
    Lesson,
    LessonProgress,
    Module,
    Quiz,
    QuizAttempt,
    User,
    UserRole,
)
from app.schemas.analytics import (
    AdminAnalyticsResponse,
    AdminCourseItem,
    AdminPlatformSummary,
    CourseProgressBucket,
    InstructorActivityEvent,
    RoleCountItem,
)

RECENT_ACTIVITY_LIMIT = 50

PROGRESS_BUCKETS = ["0-25%", "26-50%", "51-75%", "76-100%"]
ROLE_ORDER = [UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN]


def _round1(value) -> float:
    return round(value or 0.0, 1)


def _round2(value) -> float:
    return round(value or 0.0, 2)


def _bucket_for_progress(progress: int) -> str:
    if progress <= 25:
        return "0-25%"
    if progress <= 50:
        return "26-50%"
    if progress <= 75:
        return "51-75%"
    return "76-100%"


def get_admin_analytics(db: Session) -> AdminAnalyticsResponse:
    user_counts = _user_role_counts(db)
    course_rows = _course_rows(db)
    course_ids = [row.id for row in course_rows]

    enrollment_stats = _course_enrollment_stats(db, course_ids)
    lesson_counts = _course_lesson_counts(db, course_ids)
    quiz_counts = _course_quiz_counts(db, course_ids)
    quiz_stats = _course_quiz_stats(db, course_ids)

    platform_enrollments = _platform_enrollment_stats(db)
    platform_lesson_counts = _platform_lesson_stats(db)
    platform_quiz_stats = _platform_quiz_stats(db)

    courses = [
        AdminCourseItem(
            course_id=row.id,
            course_title=row.title,
            instructor_id=row.instructor_id,
            instructor_name=row.instructor_name,
            published=row.published,
            enrollment_count=enrollment_stats.get(row.id, (0, 0, 0.0))[0],
            completion_count=enrollment_stats.get(row.id, (0, 0, 0.0))[1],
            average_progress=_round1(enrollment_stats.get(row.id, (0, 0, 0.0))[2]),
            lesson_count=lesson_counts.get(row.id, 0),
            quiz_count=quiz_counts.get(row.id, 0),
            quiz_attempts=quiz_stats.get(row.id, (0, 0.0))[0],
            average_quiz_score=_round2(quiz_stats.get(row.id, (0, 0.0))[1]),
        )
        for row in course_rows
    ]

    summary = AdminPlatformSummary(
        total_users=sum(user_counts.values()),
        total_students=user_counts.get(UserRole.STUDENT, 0),
        total_instructors=user_counts.get(UserRole.INSTRUCTOR, 0),
        total_admins=user_counts.get(UserRole.ADMIN, 0),
        total_courses=len(course_rows),
        published_courses=sum(1 for row in course_rows if row.published),
        unpublished_courses=sum(1 for row in course_rows if not row.published),
        total_enrollments=platform_enrollments[0],
        completed_enrollments=platform_enrollments[1],
        overall_course_progress=_round1(platform_enrollments[2]),
        total_lessons=platform_lesson_counts[0],
        completed_lessons=platform_lesson_counts[1],
        total_quizzes=platform_quiz_stats[0],
        total_quiz_attempts=platform_quiz_stats[1],
        completed_quiz_attempts=platform_quiz_stats[2],
        average_quiz_score=_round2(platform_quiz_stats[3]),
    )

    role_distribution = [
        RoleCountItem(role=role.value, count=user_counts.get(role, 0)) for role in ROLE_ORDER
    ]
    progress_distribution = _progress_buckets(platform_enrollments[3])
    recent_activity = _build_recent_activity(db)

    return AdminAnalyticsResponse(
        summary=summary,
        courses=courses,
        role_distribution=role_distribution,
        progress_distribution=progress_distribution,
        recent_activity=recent_activity,
    )


def _user_role_counts(db: Session) -> dict[UserRole, int]:
    rows = db.execute(
        select(User.role, func.count().label("total")).group_by(User.role)
    ).all()
    return {row.role: row.total for row in rows}


def _course_rows(db: Session):
    return db.execute(
        select(Course.id, Course.title, Course.published, Course.instructor_id, User.name.label("instructor_name"))
        .join(User, Course.instructor_id == User.id)
        .order_by(Course.title.asc(), Course.id.asc())
    ).all()


def _course_enrollment_stats(
    db: Session, course_ids: list[int]
) -> dict[int, tuple[int, int, float]]:
    if not course_ids:
        return {}
    rows = db.execute(
        select(
            Enrollment.course_id,
            func.count().label("total"),
            func.sum(case((Enrollment.completed_at.is_not(None), 1), else_=0)).label("completed"),
            func.avg(Enrollment.progress).label("avg_progress"),
        )
        .where(Enrollment.course_id.in_(course_ids))
        .group_by(Enrollment.course_id)
    ).all()
    return {row.course_id: (row.total, row.completed, row.avg_progress or 0.0) for row in rows}


def _course_lesson_counts(db: Session, course_ids: list[int]) -> dict[int, int]:
    if not course_ids:
        return {}
    rows = db.execute(
        select(Module.course_id, func.count().label("total"))
        .join(Lesson, Lesson.module_id == Module.id)
        .where(Module.course_id.in_(course_ids))
        .group_by(Module.course_id)
    ).all()
    return {row.course_id: row.total for row in rows}


def _course_quiz_counts(db: Session, course_ids: list[int]) -> dict[int, int]:
    if not course_ids:
        return {}
    rows = db.execute(
        select(Module.course_id, func.count().label("total"))
        .select_from(Quiz)
        .join(Lesson, Quiz.lesson_id == Lesson.id)
        .join(Module, Lesson.module_id == Module.id)
        .where(Module.course_id.in_(course_ids))
        .group_by(Module.course_id)
    ).all()
    return {row.course_id: row.total for row in rows}


def _course_quiz_stats(db: Session, course_ids: list[int]) -> dict[int, tuple[int, float]]:
    if not course_ids:
        return {}
    rows = db.execute(
        select(
            Module.course_id,
            func.count().label("attempts"),
            func.avg(QuizAttempt.percentage).label("avg_score"),
        )
        .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
        .join(Lesson, Quiz.lesson_id == Lesson.id)
        .join(Module, Lesson.module_id == Module.id)
        .where(
            Module.course_id.in_(course_ids),
            QuizAttempt.completed_at.is_not(None),
        )
        .group_by(Module.course_id)
    ).all()
    return {row.course_id: (row.attempts, row.avg_score or 0.0) for row in rows}


def _platform_enrollment_stats(db: Session) -> tuple[int, int, float, list[int]]:
    rows = db.execute(
        select(func.count(), func.sum(case((Enrollment.completed_at.is_not(None), 1), else_=0)))
    ).one()
    progresses = db.execute(select(Enrollment.progress)).scalars().all()
    avg_progress = sum(progresses) / len(progresses) if progresses else 0.0
    return rows[0], rows[1] or 0, avg_progress, list(progresses)


def _platform_lesson_stats(db: Session) -> tuple[int, int]:
    total_lessons = db.execute(select(func.count()).select_from(Lesson)).scalar_one()
    completed_lessons = db.execute(
        select(func.count()).where(LessonProgress.completed.is_(True)).select_from(LessonProgress)
    ).scalar_one()
    return total_lessons, completed_lessons


def _platform_quiz_stats(db: Session) -> tuple[int, int, int, float]:
    total_quizzes = db.execute(select(func.count()).select_from(Quiz)).scalar_one()
    total_attempts = db.execute(select(func.count()).select_from(QuizAttempt)).scalar_one()
    completed_rows = db.execute(
        select(
            func.count(),
            func.avg(QuizAttempt.percentage),
        ).where(QuizAttempt.completed_at.is_not(None))
    ).one()
    return total_quizzes, total_attempts, completed_rows[0] or 0, completed_rows[1] or 0.0


def _progress_buckets(progresses: list[int]) -> list[CourseProgressBucket]:
    counts = {bucket: 0 for bucket in PROGRESS_BUCKETS}
    for progress in progresses:
        counts[_bucket_for_progress(progress)] += 1
    return [
        CourseProgressBucket(bucket=bucket, students=counts[bucket])
        for bucket in PROGRESS_BUCKETS
    ]


def _build_recent_activity(db: Session) -> list[InstructorActivityEvent]:
    activity_rows: list[dict] = []

    enrollment_rows = db.execute(
        select(
            Enrollment.enrolled_at,
            Enrollment.completed_at,
            Enrollment.student_id,
            User.name,
            Course.title,
        )
        .join(User, Enrollment.student_id == User.id)
        .join(Course, Enrollment.course_id == Course.id)
    ).all()
    for row in enrollment_rows:
        activity_rows.append(
            {
                "event_type": "ENROLLED",
                "student_name": row.name,
                "description": f"{row.name} enrolled in {row.title}",
                "timestamp": row.enrolled_at,
            }
        )
        if row.completed_at is not None:
            activity_rows.append(
                {
                    "event_type": "COURSE_COMPLETED",
                    "student_name": row.name,
                    "description": f"{row.name} completed {row.title}",
                    "timestamp": row.completed_at,
                }
            )

    lesson_rows = db.execute(
        select(
            LessonProgress.started_at,
            LessonProgress.completed_at,
            LessonProgress.student_id,
            User.name,
            Lesson.title,
        )
        .join(User, LessonProgress.student_id == User.id)
        .join(Lesson, LessonProgress.lesson_id == Lesson.id)
    ).all()
    for row in lesson_rows:
        if row.started_at is not None:
            activity_rows.append(
                {
                    "event_type": "LESSON_STARTED",
                    "student_name": row.name,
                    "description": f"{row.name} started lesson {row.title}",
                    "timestamp": row.started_at,
                }
            )
        if row.completed_at is not None:
            activity_rows.append(
                {
                    "event_type": "LESSON_COMPLETED",
                    "student_name": row.name,
                    "description": f"{row.name} completed lesson {row.title}",
                    "timestamp": row.completed_at,
                }
            )

    quiz_rows = db.execute(
        select(
            QuizAttempt.completed_at,
            QuizAttempt.student_id,
            QuizAttempt.percentage,
            User.name,
            Quiz.title,
        )
        .join(User, QuizAttempt.student_id == User.id)
        .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
        .where(QuizAttempt.completed_at.is_not(None))
    ).all()
    for row in quiz_rows:
        activity_rows.append(
            {
                "event_type": "QUIZ_COMPLETED",
                "student_name": row.name,
                "description": f"{row.name} completed quiz {row.title} ({row.percentage:g}%)",
                "timestamp": row.completed_at,
            }
        )

    activity_rows.sort(
        key=lambda event: event["timestamp"] if event["timestamp"] is not None else datetime.min,
        reverse=True,
    )
    return [
        InstructorActivityEvent(**event)
        for event in activity_rows[:RECENT_ACTIVITY_LIMIT]
    ]