from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Course, Lesson, LessonProgress, Module
from app.schemas.course import LessonResponse
from app.schemas.learning import CourseProgressResponse, LessonProgressResponse, LessonProgressUpdate
from app.services import enrollment_service


def _require_published_lesson_course(db: Session, lesson_id: int) -> tuple[Lesson, Course]:
    row = db.execute(
        select(Lesson, Course)
        .join(Module, Lesson.module_id == Module.id)
        .join(Course, Module.course_id == Course.id)
        .where(Lesson.id == lesson_id)
    ).first()
    if row is None or not row[1].published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    return row[0], row[1]


def get_lesson_progress_row(
    db: Session, student_id: int, lesson_id: int
) -> LessonProgress | None:
    return db.scalar(
        select(LessonProgress).where(
            LessonProgress.student_id == student_id, LessonProgress.lesson_id == lesson_id
        )
    )


def get_lesson_progress(
    db: Session, student_id: int, lesson_id: int
) -> LessonProgressResponse:
    _lesson, course = _require_published_lesson_course(db, lesson_id)
    enrollment_service.require_enrollment(db, student_id, course.id)
    row = get_lesson_progress_row(db, student_id, lesson_id)
    if row is None:
        return LessonProgressResponse(
            id=None,
            student_id=student_id,
            lesson_id=lesson_id,
            completed=False,
            watch_time=0.0,
            last_position=0.0,
            started_at=None,
            completed_at=None,
            created_at=None,
            updated_at=None,
        )
    return LessonProgressResponse.model_validate(row)


def update_lesson_progress(
    db: Session,
    student_id: int,
    lesson_id: int,
    payload: LessonProgressUpdate,
) -> LessonProgress:
    _lesson, course = _require_published_lesson_course(db, lesson_id)
    enrollment_service.require_enrollment(db, student_id, course.id)
    row = get_lesson_progress_row(db, student_id, lesson_id)
    if row is None:
        row = LessonProgress(student_id=student_id, lesson_id=lesson_id, started_at=None)
        db.add(row)
        db.flush()
    if payload.watch_time is not None:
        row.watch_time = payload.watch_time
    if payload.last_position is not None:
        row.last_position = payload.last_position
    if row.started_at is None:
        row.started_at = datetime.now(timezone.utc)
    if payload.completed is True:
        row.completed = True
        if row.completed_at is None:
            row.completed_at = datetime.now(timezone.utc)
    elif payload.completed is False:
        row.completed = False
        row.completed_at = None
    enrollment_service.recalculate_course_progress(db, student_id, course.id)
    db.refresh(row)
    return row


def get_course_progress_summary(
    db: Session, student_id: int, course_id: int
) -> CourseProgressResponse:
    course = db.scalar(select(Course).where(Course.id == course_id))
    if course is None or not course.published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    enrollment_service.require_enrollment(db, student_id, course_id)
    total, completed_count, progress = enrollment_service.compute_course_progress(
        db, student_id, course_id
    )
    next_lesson = enrollment_service.first_incomplete_lesson(db, student_id, course_id)
    return CourseProgressResponse(
        course_id=course_id,
        total_lessons=total,
        completed_lessons=completed_count,
        progress=progress,
        completed=progress == 100 and total > 0,
        next_lesson=LessonResponse.model_validate(next_lesson) if next_lesson else None,
    )