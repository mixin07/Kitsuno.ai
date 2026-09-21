from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import and_, delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Course, Enrollment, Lesson, LessonProgress, Module, User


def get_published_course(db: Session, course_id: int) -> Course:
    course = db.scalar(select(Course).where(Course.id == course_id))
    if course is None or not course.published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


def get_enrollment(db: Session, student_id: int, course_id: int) -> Enrollment | None:
    return db.scalar(
        select(Enrollment).where(
            Enrollment.student_id == student_id, Enrollment.course_id == course_id
        )
    )


def require_enrollment(db: Session, student_id: int, course_id: int) -> Enrollment:
    enrollment = get_enrollment(db, student_id, course_id)
    if enrollment is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Enroll in this course to access content",
        )
    return enrollment


def list_course_lessons_ordered(db: Session, course_id: int) -> list[Lesson]:
    return list(
        db.scalars(
            select(Lesson)
            .join(Module, Lesson.module_id == Module.id)
            .where(Module.course_id == course_id)
            .order_by(Module.order_number, Module.id, Lesson.order_number, Lesson.id)
        )
    )


def _progress_map(db: Session, student_id: int) -> dict[int, LessonProgress]:
    rows = db.scalars(
        select(LessonProgress).where(LessonProgress.student_id == student_id)
    )
    return {row.lesson_id: row for row in rows}


def compute_course_progress(
    db: Session, student_id: int, course_id: int
) -> tuple[int, int, int]:
    lessons = list_course_lessons_ordered(db, course_id)
    total = len(lessons)
    if total == 0:
        return 0, 0, 0
    progress_map = _progress_map(db, student_id)
    completed_count = sum(1 for lesson in lessons if progress_map.get(lesson.id) and progress_map[lesson.id].completed)
    progress = round(completed_count * 100 / total)
    return total, completed_count, progress


def first_incomplete_lesson(db: Session, student_id: int, course_id: int) -> Lesson | None:
    lessons = list_course_lessons_ordered(db, course_id)
    if not lessons:
        return None
    progress_map = _progress_map(db, student_id)
    for lesson in lessons:
        row = progress_map.get(lesson.id)
        if row is None or not row.completed:
            return lesson
    return None


def recalculate_course_progress(
    db: Session, student_id: int, course_id: int
) -> tuple[int, int, int]:
    db.flush()
    total, completed_count, progress = compute_course_progress(db, student_id, course_id)
    enrollment = get_enrollment(db, student_id, course_id)
    if enrollment is not None:
        enrollment.progress = progress
        enrollment.completed_at = (
            datetime.now(timezone.utc) if progress == 100 else None
        )
        db.commit()
        db.refresh(enrollment)
    else:
        db.commit()
    return total, completed_count, progress


def enroll_in_course(db: Session, student_id: int, course_id: int) -> Enrollment:
    get_published_course(db, course_id)
    existing = get_enrollment(db, student_id, course_id)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already enrolled in this course",
        )
    enrollment = Enrollment(student_id=student_id, course_id=course_id, progress=0)
    db.add(enrollment)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already enrolled in this course",
        ) from None
    db.refresh(enrollment)
    return enrollment


def list_student_enrollments(db: Session, student_id: int) -> list[Enrollment]:
    return list(
        db.scalars(
            select(Enrollment)
            .where(Enrollment.student_id == student_id)
            .order_by(Enrollment.enrolled_at.desc())
        )
    )


def unenroll_in_course(db: Session, student_id: int, course_id: int) -> None:
    enrollment = get_enrollment(db, student_id, course_id)
    if enrollment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found"
        )
    lesson_ids = [lesson.id for lesson in list_course_lessons_ordered(db, course_id)]
    if lesson_ids:
        db.execute(
            delete(LessonProgress).where(
                LessonProgress.student_id == student_id,
                LessonProgress.lesson_id.in_(lesson_ids),
            )
        )
    db.delete(enrollment)
    db.commit()