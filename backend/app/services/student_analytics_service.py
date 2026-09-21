from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import Course, Enrollment, Lesson, LessonProgress, Module, Quiz, QuizAttempt
from app.schemas.analytics import (
    ActivityEvent,
    AnalyticsSummary,
    CourseAnalyticsItem,
    QuizPerformanceItem,
    StudentAnalyticsResponse,
)

RECENT_ACTIVITY_LIMIT = 20


def get_student_analytics(db: Session, student_id: int) -> StudentAnalyticsResponse:
    enrollments = list(
        db.scalars(
            select(Enrollment)
            .options(joinedload(Enrollment.course))
            .where(Enrollment.student_id == student_id)
            .order_by(Enrollment.enrolled_at.desc())
        )
    )
    course_ids = [enrollment.course_id for enrollment in enrollments]
    course_title_map = {enrollment.course_id: enrollment.course.title for enrollment in enrollments}

    progress_rows = list(
        db.scalars(select(LessonProgress).where(LessonProgress.student_id == student_id))
    )
    progress_map = {row.lesson_id: row for row in progress_rows}

    lesson_course_map: dict[int, int] = {}
    lesson_title_map: dict[int, str] = {}
    lessons_by_course: dict[int, list[int]] = {}
    if course_ids:
        lesson_rows = db.execute(
            select(Lesson.id, Lesson.title, Module.course_id)
            .join(Module, Lesson.module_id == Module.id)
            .where(Module.course_id.in_(course_ids))
            .order_by(Module.order_number, Module.id, Lesson.order_number, Lesson.id)
        )
        for lesson_id, lesson_title, course_id in lesson_rows:
            lesson_course_map[lesson_id] = course_id
            lesson_title_map[lesson_id] = lesson_title
            lessons_by_course.setdefault(course_id, []).append(lesson_id)

    completed_attempts = []
    if course_ids:
        completed_attempts = list(
            db.execute(
                select(
                    QuizAttempt.percentage,
                    QuizAttempt.completed_at,
                    QuizAttempt.quiz_id,
                    Quiz.title.label("quiz_title"),
                    Quiz.lesson_id,
                    Module.course_id,
                    Course.title.label("course_title"),
                )
                .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
                .join(Lesson, Quiz.lesson_id == Lesson.id)
                .join(Module, Lesson.module_id == Module.id)
                .join(Course, Module.course_id == Course.id)
                .where(
                    QuizAttempt.student_id == student_id,
                    QuizAttempt.completed_at.is_not(None),
                    Module.course_id.in_(course_ids),
                )
                .order_by(QuizAttempt.completed_at.desc(), QuizAttempt.created_at.desc())
            )
        )

    summary = _build_summary(enrollments, progress_rows, completed_attempts)
    course_items = _build_course_items(
        enrollments, lessons_by_course, lesson_title_map, progress_map
    )
    quiz_items = _build_quiz_performance(completed_attempts)
    activity = _build_recent_activity(
        enrollments,
        progress_rows,
        completed_attempts,
        course_title_map,
        lesson_course_map,
        lesson_title_map,
    )

    return StudentAnalyticsResponse(
        summary=summary,
        courses=course_items,
        quiz_performance=quiz_items,
        recent_activity=activity,
    )


def _build_summary(
    enrollments: list[Enrollment],
    progress_rows: list[LessonProgress],
    completed_attempts: list,
) -> AnalyticsSummary:
    total_courses = len(enrollments)
    completed_courses = sum(1 for enrollment in enrollments if enrollment.completed_at is not None)
    if total_courses:
        overall_progress = round(
            sum(enrollment.progress for enrollment in enrollments) / total_courses
        )
    else:
        overall_progress = 0

    percentages = [row.percentage for row in completed_attempts]
    return AnalyticsSummary(
        total_courses=total_courses,
        completed_courses=completed_courses,
        active_courses=total_courses - completed_courses,
        overall_progress=overall_progress,
        lessons_completed=sum(1 for row in progress_rows if row.completed),
        lessons_started=sum(1 for row in progress_rows if row.started_at is not None),
        quiz_attempts=len(completed_attempts),
        average_quiz_score=round(sum(percentages) / len(percentages), 2) if percentages else 0.0,
        best_quiz_score=max(percentages) if percentages else 0.0,
    )


def _build_course_items(
    enrollments: list[Enrollment],
    lessons_by_course: dict[int, list[int]],
    lesson_title_map: dict[int, str],
    progress_map: dict[int, LessonProgress],
) -> list[CourseAnalyticsItem]:
    items: list[CourseAnalyticsItem] = []
    for enrollment in enrollments:
        lesson_ids = lessons_by_course.get(enrollment.course_id, [])
        completed_lessons = sum(
            1
            for lesson_id in lesson_ids
            if progress_map.get(lesson_id) and progress_map[lesson_id].completed
        )
        next_lesson_id: int | None = None
        next_lesson_title: str | None = None
        for lesson_id in lesson_ids:
            row = progress_map.get(lesson_id)
            if row is None or not row.completed:
                next_lesson_id = lesson_id
                next_lesson_title = lesson_title_map.get(lesson_id)
                break
        items.append(
            CourseAnalyticsItem(
                course_id=enrollment.course_id,
                title=enrollment.course.title,
                progress=enrollment.progress,
                completed_lessons=completed_lessons,
                total_lessons=len(lesson_ids),
                completed=enrollment.completed_at is not None,
                next_lesson_id=next_lesson_id,
                next_lesson_title=next_lesson_title,
            )
        )
    return items


def _build_quiz_performance(completed_attempts: list) -> list[QuizPerformanceItem]:
    stats: dict[int, dict] = {}
    for row in completed_attempts:
        quiz_id = row.quiz_id
        entry = stats.setdefault(
            quiz_id,
            {
                "quiz_title": row.quiz_title,
                "course_id": row.course_id,
                "course_title": row.course_title,
                "attempts": 0,
                "total_percentage": 0.0,
                "best_percentage": 0.0,
                "last_attempt_at": None,
            },
        )
        entry["attempts"] += 1
        entry["total_percentage"] += row.percentage
        entry["best_percentage"] = max(entry["best_percentage"], row.percentage)
        if entry["last_attempt_at"] is None or (
            row.completed_at is not None and row.completed_at > entry["last_attempt_at"]
        ):
            entry["last_attempt_at"] = row.completed_at

    items = [
        QuizPerformanceItem(
            quiz_id=quiz_id,
            quiz_title=entry["quiz_title"],
            course_id=entry["course_id"],
            course_title=entry["course_title"],
            attempts=entry["attempts"],
            average_percentage=round(entry["total_percentage"] / entry["attempts"], 2),
            best_percentage=round(entry["best_percentage"], 2),
            last_attempt_at=entry["last_attempt_at"],
        )
        for quiz_id, entry in stats.items()
    ]
    items.sort(key=lambda item: item.last_attempt_at or item.quiz_id, reverse=True)
    return items


def _build_recent_activity(
    enrollments: list[Enrollment],
    progress_rows: list[LessonProgress],
    completed_attempts: list,
    course_title_map: dict[int, str],
    lesson_course_map: dict[int, int],
    lesson_title_map: dict[int, str],
) -> list[ActivityEvent]:
    events: list[dict] = []

    for enrollment in enrollments:
        events.append(
            {
                "event_type": "ENROLLED",
                "description": f"Enrolled in {enrollment.course.title}",
                "timestamp": enrollment.enrolled_at,
            }
        )
        if enrollment.completed_at is not None:
            events.append(
                {
                    "event_type": "COURSE_COMPLETED",
                    "description": f"Completed course {enrollment.course.title}",
                    "timestamp": enrollment.completed_at,
                }
            )

    for row in progress_rows:
        course_title = course_title_map.get(lesson_course_map.get(row.lesson_id))
        context = f" (in {course_title})" if course_title else ""
        if row.started_at is not None:
            events.append(
                {
                    "event_type": "LESSON_STARTED",
                    "description": f"Started lesson {lesson_title_map.get(row.lesson_id, '')}{context}",
                    "timestamp": row.started_at,
                }
            )
        if row.completed_at is not None:
            events.append(
                {
                    "event_type": "LESSON_COMPLETED",
                    "description": f"Completed lesson {lesson_title_map.get(row.lesson_id, '')}{context}",
                    "timestamp": row.completed_at,
                }
            )

    for row in completed_attempts:
        events.append(
            {
                "event_type": "QUIZ_COMPLETED",
                "description": f"Completed quiz {row.quiz_title} ({row.percentage:g}%)",
                "timestamp": row.completed_at,
            }
        )

    events.sort(key=lambda event: event["timestamp"], reverse=True)
    events = events[:RECENT_ACTIVITY_LIMIT]
    return [ActivityEvent(**event) for event in events]