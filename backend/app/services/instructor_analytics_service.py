from __future__ import annotations

from datetime import datetime

from sqlalchemy import case, func, or_, select
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
    CourseProgressBucket,
    CourseProgressInfo,
    InstructorActivityEvent,
    InstructorCourseAnalytics,
    InstructorCourseSummary,
    LessonAnalyticsItem,
    QuizAnalyticsItem,
    StudentPerformanceItem,
)

RECENT_ACTIVITY_LIMIT = 50

PROGRESS_BUCKETS = ["0-25%", "26-50%", "51-75%", "76-100%"]


def _percent(part: int, whole: int) -> float:
    if whole <= 0:
        return 0.0
    return part * 100.0 / whole


def _round1(value) -> float:
    return round(value or 0.0, 1)


def _round2(value) -> float:
    return round(value or 0.0, 2)


def _managed_course_rows(db: Session, user: User):
    statement = select(Course.id, Course.title, Course.published)
    if user.role != UserRole.ADMIN:
        statement = statement.where(Course.instructor_id == user.id)
    return db.execute(statement.order_by(Course.title.asc(), Course.id.asc())).all()


def _course_enrollment_stats(db: Session, course_ids: list[int]) -> dict[int, tuple[int, int, float]]:
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


def _course_completed_lesson_activity(db: Session, course_ids: list[int]) -> dict[int, int]:
    if not course_ids:
        return {}
    rows = db.execute(
        select(
            Module.course_id,
            func.sum(case((LessonProgress.completed.is_(True), 1), else_=0)).label("total"),
        )
        .join(Lesson, LessonProgress.lesson_id == Lesson.id)
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


def _build_summary(
    course_id: int,
    course_title: str,
    published: bool,
    total_enrolled: int,
    completed_count: int,
    avg_progress: float,
    total_lessons: int,
    completed_lesson_activity: int,
    total_quiz_attempts: int,
    avg_quiz_score: float,
) -> InstructorCourseSummary:
    return InstructorCourseSummary(
        course_id=course_id,
        course_title=course_title,
        published=published,
        total_enrolled=total_enrolled,
        active_students=total_enrolled - completed_count,
        completed_students=completed_count,
        average_progress=_round1(avg_progress),
        completion_rate=_round1(_percent(completed_count, total_enrolled)),
        total_lessons=total_lessons,
        completed_lesson_activity=completed_lesson_activity,
        total_quiz_attempts=total_quiz_attempts,
        average_quiz_score=_round2(avg_quiz_score),
    )


def list_instructor_course_summaries(db: Session, user: User) -> list[InstructorCourseSummary]:
    course_rows = _managed_course_rows(db, user)
    course_ids = [row.id for row in course_rows]
    if not course_ids:
        return []

    enrollment_stats = _course_enrollment_stats(db, course_ids)
    lesson_counts = _course_lesson_counts(db, course_ids)
    completed_activity = _course_completed_lesson_activity(db, course_ids)
    quiz_stats = _course_quiz_stats(db, course_ids)

    summaries = []
    for row in course_rows:
        total, completed, avg_progress = enrollment_stats.get(row.id, (0, 0, 0.0))
        attempts, avg_score = quiz_stats.get(row.id, (0, 0.0))
        summaries.append(
            _build_summary(
                course_id=row.id,
                course_title=row.title,
                published=row.published,
                total_enrolled=total,
                completed_count=completed,
                avg_progress=avg_progress,
                total_lessons=lesson_counts.get(row.id, 0),
                completed_lesson_activity=completed_activity.get(row.id, 0),
                total_quiz_attempts=attempts,
                avg_quiz_score=avg_score,
            )
        )
    return summaries


def get_instructor_course_analytics(db: Session, course: Course) -> InstructorCourseAnalytics:
    course_id = course.id

    lesson_rows = db.execute(
        select(Lesson.id, Lesson.title, Module.title)
        .join(Module, Lesson.module_id == Module.id)
        .where(Module.course_id == course_id)
        .order_by(Module.order_number, Module.id, Lesson.order_number, Lesson.id)
    ).all()

    enrollment_rows = db.execute(
        select(
            Enrollment.progress,
            Enrollment.completed_at,
            Enrollment.enrolled_at,
            Enrollment.student_id,
            User.name,
            User.email,
        )
        .join(User, Enrollment.student_id == User.id)
        .where(Enrollment.course_id == course_id)
        .order_by(User.name.asc(), Enrollment.student_id.asc())
    ).all()

    total_enrolled = len(enrollment_rows)
    completed_count = sum(1 for row in enrollment_rows if row.completed_at is not None)
    progresses = [row.progress for row in enrollment_rows]
    avg_progress = sum(progresses) / len(progresses) if progresses else 0.0
    min_progress = min(progresses) if progresses else 0
    max_progress = max(progresses) if progresses else 0

    lesson_stats = _lesson_stats(db, course_id)

    lesson_items = [
        LessonAnalyticsItem(
            lesson_id=row.id,
            lesson_title=row[1],
            module_title=row[2],
            total_enrolled_students=total_enrolled,
            students_started=lesson_stats.get(row.id, (0, 0))[0],
            students_completed=lesson_stats.get(row.id, (0, 0))[1],
            completion_percentage=_round1(
                _percent(lesson_stats.get(row.id, (0, 0))[1], total_enrolled)
            ),
        )
        for row in lesson_rows
    ]

    quiz_rows = _quiz_rows(db, course_id)
    completed_attempts_total = sum(row.completed_attempts for row in quiz_rows)
    score_sum = sum(
        (row.avg_score or 0.0) * row.completed_attempts for row in quiz_rows
    )
    quiz_items = [
        QuizAnalyticsItem(
            quiz_id=row.id,
            quiz_title=row.title,
            lesson_title=row.lesson_title,
            total_attempts=row.total_attempts,
            unique_students=row.unique_students,
            average_score=_round2(row.avg_score),
            best_score=_round2(row.best_score),
            lowest_score=_round2(row.lowest_score),
            completion_rate=_round1(_percent(row.completed_attempts, row.total_attempts)),
        )
        for row in quiz_rows
    ]

    lp_counts = _student_lesson_completions(db, course_id)
    quiz_student_stats = _student_quiz_stats(db, course_id)
    last_activity = _student_last_activity(db, course_id)

    student_items = [
        StudentPerformanceItem(
            student_id=row.student_id,
            student_name=row.name,
            student_email=row.email,
            course_progress=row.progress,
            lessons_completed=lp_counts.get(row.student_id, 0),
            total_lessons=len(lesson_rows),
            quiz_attempts=quiz_student_stats.get(row.student_id, (0, 0.0))[0],
            average_quiz_score=_round2(quiz_student_stats.get(row.student_id, (0, 0.0))[1]),
            last_activity=last_activity.get(row.student_id),
            completed=row.completed_at is not None,
        )
        for row in enrollment_rows
    ]

    activity = _build_activity(db, course)

    total_lesson_activity = sum(stats[1] for stats in lesson_stats.values())
    buckets = _progress_buckets(progresses)

    summary = _build_summary(
        course_id=course.id,
        course_title=course.title,
        published=course.published,
        total_enrolled=total_enrolled,
        completed_count=completed_count,
        avg_progress=avg_progress,
        total_lessons=len(lesson_rows),
        completed_lesson_activity=total_lesson_activity,
        total_quiz_attempts=completed_attempts_total,
        avg_quiz_score=score_sum / completed_attempts_total if completed_attempts_total else 0.0,
    )

    progress_info = CourseProgressInfo(
        total_enrolled=total_enrolled,
        average_progress=_round1(avg_progress),
        min_progress=min_progress,
        max_progress=max_progress,
        completed_students=completed_count,
        active_students=total_enrolled - completed_count,
        completion_percentage=_round1(_percent(completed_count, total_enrolled)),
        progress_buckets=buckets,
    )

    return InstructorCourseAnalytics(
        course_id=course.id,
        course_title=course.title,
        published=course.published,
        summary=summary,
        progress=progress_info,
        lesson_analytics=lesson_items,
        quiz_analytics=quiz_items,
        student_performance=student_items,
        recent_activity=activity,
    )


def _lesson_stats(db: Session, course_id: int) -> dict[int, tuple[int, int]]:
    rows = db.execute(
        select(
            LessonProgress.lesson_id,
            func.sum(
                case((LessonProgress.started_at.is_not(None), 1), else_=0)
            ).label("started"),
            func.sum(case((LessonProgress.completed.is_(True), 1), else_=0)).label("completed"),
        )
        .join(Lesson, LessonProgress.lesson_id == Lesson.id)
        .join(Module, Lesson.module_id == Module.id)
        .where(Module.course_id == course_id)
        .group_by(LessonProgress.lesson_id)
    ).all()
    return {row.lesson_id: (row.started, row.completed) for row in rows}


def _quiz_rows(db: Session, course_id: int):
    attempt_stats = (
        select(
            QuizAttempt.quiz_id.label("quiz_id"),
            func.count().label("total_attempts"),
            func.count(func.distinct(QuizAttempt.student_id)).label("unique_students"),
        )
        .group_by(QuizAttempt.quiz_id)
    ).subquery()

    completed_stats = (
        select(
            QuizAttempt.quiz_id.label("quiz_id"),
            func.count().label("completed_attempts"),
            func.avg(QuizAttempt.percentage).label("avg_score"),
            func.max(QuizAttempt.percentage).label("best_score"),
            func.min(QuizAttempt.percentage).label("lowest_score"),
        )
        .where(QuizAttempt.completed_at.is_not(None))
        .group_by(QuizAttempt.quiz_id)
    ).subquery()

    return db.execute(
        select(
            Quiz.id,
            Quiz.title,
            Lesson.title.label("lesson_title"),
            func.coalesce(attempt_stats.c.total_attempts, 0).label("total_attempts"),
            func.coalesce(attempt_stats.c.unique_students, 0).label("unique_students"),
            func.coalesce(completed_stats.c.completed_attempts, 0).label("completed_attempts"),
            completed_stats.c.avg_score,
            completed_stats.c.best_score,
            completed_stats.c.lowest_score,
        )
        .join(Lesson, Quiz.lesson_id == Lesson.id)
        .join(Module, Lesson.module_id == Module.id)
        .outerjoin(attempt_stats, attempt_stats.c.quiz_id == Quiz.id)
        .outerjoin(completed_stats, completed_stats.c.quiz_id == Quiz.id)
        .where(Module.course_id == course_id)
        .order_by(Lesson.order_number, Lesson.id, Quiz.title)
    ).all()


def _student_lesson_completions(db: Session, course_id: int) -> dict[int, int]:
    rows = db.execute(
        select(
            LessonProgress.student_id,
            func.sum(case((LessonProgress.completed.is_(True), 1), else_=0)).label("completed"),
        )
        .join(Lesson, LessonProgress.lesson_id == Lesson.id)
        .join(Module, Lesson.module_id == Module.id)
        .where(Module.course_id == course_id)
        .group_by(LessonProgress.student_id)
    ).all()
    return {row.student_id: row.completed for row in rows}


def _student_quiz_stats(db: Session, course_id: int) -> dict[int, tuple[int, float]]:
    rows = db.execute(
        select(
            QuizAttempt.student_id,
            func.count().label("attempts"),
            func.avg(QuizAttempt.percentage).label("avg_score"),
        )
        .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
        .join(Lesson, Quiz.lesson_id == Lesson.id)
        .join(Module, Lesson.module_id == Module.id)
        .where(
            Module.course_id == course_id,
            QuizAttempt.completed_at.is_not(None),
        )
        .group_by(QuizAttempt.student_id)
    ).all()
    return {row.student_id: (row.attempts, row.avg_score or 0.0) for row in rows}


def _student_last_activity(db: Session, course_id: int) -> dict[int, datetime]:
    enrolled_ts = select(
        Enrollment.student_id.label("student_id"),
        Enrollment.enrolled_at.label("ts"),
    ).where(Enrollment.course_id == course_id)
    course_completed_ts = select(
        Enrollment.student_id.label("student_id"),
        Enrollment.completed_at.label("ts"),
    ).where(
        Enrollment.course_id == course_id,
        Enrollment.completed_at.is_not(None),
    )

    lesson_started_ts = (
        select(
            LessonProgress.student_id.label("student_id"),
            LessonProgress.started_at.label("ts"),
        )
        .join(Lesson, LessonProgress.lesson_id == Lesson.id)
        .join(Module, Lesson.module_id == Module.id)
        .where(Module.course_id == course_id, LessonProgress.started_at.is_not(None))
    )
    lesson_completed_ts = (
        select(
            LessonProgress.student_id.label("student_id"),
            LessonProgress.completed_at.label("ts"),
        )
        .join(Lesson, LessonProgress.lesson_id == Lesson.id)
        .join(Module, Lesson.module_id == Module.id)
        .where(Module.course_id == course_id, LessonProgress.completed_at.is_not(None))
    )
    quiz_completed_ts = (
        select(
            QuizAttempt.student_id.label("student_id"),
            QuizAttempt.completed_at.label("ts"),
        )
        .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
        .join(Lesson, Quiz.lesson_id == Lesson.id)
        .join(Module, Lesson.module_id == Module.id)
        .where(Module.course_id == course_id, QuizAttempt.completed_at.is_not(None))
    )

    all_ts = enrolled_ts.union_all(
        course_completed_ts, lesson_started_ts, lesson_completed_ts, quiz_completed_ts
    ).subquery()
    rows = db.execute(
        select(all_ts.c.student_id, func.max(all_ts.c.ts).label("last_ts")).group_by(
            all_ts.c.student_id
        )
    ).all()
    return {row.student_id: row.last_ts for row in rows}


def _progress_buckets(progresses: list[int]) -> list[CourseProgressBucket]:
    counts = {bucket: 0 for bucket in PROGRESS_BUCKETS}
    for progress in progresses:
        if progress <= 25:
            counts["0-25%"] += 1
        elif progress <= 50:
            counts["26-50%"] += 1
        elif progress <= 75:
            counts["51-75%"] += 1
        else:
            counts["76-100%"] += 1
    return [CourseProgressBucket(bucket=bucket, students=counts[bucket]) for bucket in PROGRESS_BUCKETS]


def _build_activity(db: Session, course: Course) -> list[InstructorActivityEvent]:
    enrollment_rows = db.execute(
        select(
            Enrollment.enrolled_at,
            Enrollment.completed_at,
            Enrollment.student_id,
            User.name,
        )
        .join(User, Enrollment.student_id == User.id)
        .where(Enrollment.course_id == course.id)
    ).all()

    activity_rows: list[dict] = []
    for row in enrollment_rows:
        activity_rows.append(
            {
                "event_type": "ENROLLED",
                "student_name": row.name,
                "description": f"{row.name} enrolled in {course.title}",
                "timestamp": row.enrolled_at,
            }
        )
        if row.completed_at is not None:
            activity_rows.append(
                {
                    "event_type": "COURSE_COMPLETED",
                    "student_name": row.name,
                    "description": f"{row.name} completed {course.title}",
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
        .join(Module, Lesson.module_id == Module.id)
        .where(
            Module.course_id == course.id,
            or_(
                LessonProgress.started_at.is_not(None),
                LessonProgress.completed_at.is_not(None),
            ),
        )
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
        .join(Lesson, Quiz.lesson_id == Lesson.id)
        .join(Module, Lesson.module_id == Module.id)
        .where(
            Module.course_id == course.id,
            QuizAttempt.completed_at.is_not(None),
        )
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