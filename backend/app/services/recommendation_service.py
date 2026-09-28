from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Module
from app.schemas.recommendation import StudentRecommendationResponse
from app.services import enrollment_service


def get_student_recommendation(
    db: Session, student_id: int
) -> StudentRecommendationResponse:
    enrollments = enrollment_service.list_student_enrollments(db, student_id)
    if not enrollments:
        return StudentRecommendationResponse(
            status="no_enrollment",
            explanation="You haven't enrolled in a course yet.",
        )

    detailed_enrollments = []
    for enrollment in enrollments:
        total, completed_count, progress = enrollment_service.compute_course_progress(
            db, student_id, enrollment.course_id
        )
        next_lesson = enrollment_service.first_incomplete_lesson(
            db, student_id, enrollment.course_id
        )
        detailed_enrollments.append(
            {
                "enrollment": enrollment,
                "total": total,
                "completed_count": completed_count,
                "progress": progress,
                "next_lesson": next_lesson,
            }
        )

    # Priority selection order:
    # 1. First enrollment with progress > 0 and < 100 that has an incomplete lesson
    # 2. First enrollment with progress == 0 that has an incomplete lesson
    # 3. Any enrollment with an incomplete lesson
    selected = None
    for item in detailed_enrollments:
        if 0 < item["progress"] < 100 and item["next_lesson"] is not None:
            selected = item
            break

    if selected is None:
        for item in detailed_enrollments:
            if item["progress"] == 0 and item["next_lesson"] is not None:
                selected = item
                break

    if selected is None:
        for item in detailed_enrollments:
            if item["next_lesson"] is not None:
                selected = item
                break

    # If all enrolled courses are completed or have no lessons
    if selected is None:
        most_recent = detailed_enrollments[0]
        course = most_recent["enrollment"].course
        return StudentRecommendationResponse(
            status="completed",
            course_id=course.id,
            course_title=course.title,
            category=course.category,
            completed_lessons=most_recent["completed_count"],
            total_lessons=most_recent["total"],
            progress_percentage=most_recent["progress"],
            explanation="You've completed all lessons in your enrolled courses.",
        )

    course = selected["enrollment"].course
    next_lesson = selected["next_lesson"]
    module = db.scalar(select(Module).where(Module.id == next_lesson.module_id))

    if selected["completed_count"] > 0:
        explanation = (
            f"Recommended because you're currently learning {course.title} "
            f"and have completed {selected['completed_count']} of {selected['total']} lessons."
        )
    else:
        explanation = f"Start your learning path in {course.title} with the first lesson."

    return StudentRecommendationResponse(
        status="in_progress",
        course_id=course.id,
        course_title=course.title,
        category=course.category,
        module_id=module.id if module else None,
        module_title=module.title if module else None,
        lesson_id=next_lesson.id,
        lesson_title=next_lesson.title,
        duration_minutes=next_lesson.duration_minutes,
        completed_lessons=selected["completed_count"],
        total_lessons=selected["total"],
        progress_percentage=selected["progress"],
        explanation=explanation,
    )
