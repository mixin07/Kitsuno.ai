from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Course, Enrollment, Lesson, Module
from app.models.saved_item import SavedCourse, SavedLesson, SavedNote, UserCourseStatus
from app.schemas.saved_item import (
    CourseStatusItemResponse,
    SavedCourseItemResponse,
    SavedLessonItemResponse,
    SavedNoteItemResponse,
    SavedOverviewResponse,
)


def save_course(db: Session, user_id: int, course_id: int) -> SavedCourse:
    course = db.scalar(select(Course).where(Course.id == course_id))
    if course is None or not course.published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    existing = db.scalar(
        select(SavedCourse).where(
            SavedCourse.user_id == user_id, SavedCourse.course_id == course_id
        )
    )
    if existing is not None:
        return existing

    item = SavedCourse(user_id=user_id, course_id=course_id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def unsave_course(db: Session, user_id: int, course_id: int) -> None:
    item = db.scalar(
        select(SavedCourse).where(
            SavedCourse.user_id == user_id, SavedCourse.course_id == course_id
        )
    )
    if item is not None:
        db.delete(item)
        db.commit()


def list_saved_courses(db: Session, user_id: int) -> list[SavedCourseItemResponse]:
    rows = list(
        db.scalars(
            select(SavedCourse)
            .where(SavedCourse.user_id == user_id)
            .order_by(SavedCourse.created_at.desc())
        )
    )
    return [
        SavedCourseItemResponse(
            id=row.id,
            course_id=row.course_id,
            created_at=row.created_at,
            course=row.course,
        )
        for row in rows
        if row.course and row.course.published
    ]


def save_lesson(db: Session, user_id: int, lesson_id: int) -> SavedLesson:
    lesson = db.scalar(select(Lesson).where(Lesson.id == lesson_id))
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    existing = db.scalar(
        select(SavedLesson).where(
            SavedLesson.user_id == user_id, SavedLesson.lesson_id == lesson_id
        )
    )
    if existing is not None:
        return existing

    item = SavedLesson(user_id=user_id, lesson_id=lesson_id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def unsave_lesson(db: Session, user_id: int, lesson_id: int) -> None:
    item = db.scalar(
        select(SavedLesson).where(
            SavedLesson.user_id == user_id, SavedLesson.lesson_id == lesson_id
        )
    )
    if item is not None:
        db.delete(item)
        db.commit()


def list_saved_lessons(db: Session, user_id: int) -> list[SavedLessonItemResponse]:
    rows = list(
        db.scalars(
            select(SavedLesson)
            .where(SavedLesson.user_id == user_id)
            .order_by(SavedLesson.created_at.desc())
        )
    )
    results = []
    for row in rows:
        lesson = row.lesson
        if not lesson:
            continue
        module = db.scalar(select(Module).where(Module.id == lesson.module_id))
        course = db.scalar(select(Course).where(Course.id == module.course_id)) if module else None
        if not course or not course.published:
            continue
        results.append(
            SavedLessonItemResponse(
                id=row.id,
                lesson_id=row.lesson_id,
                course_id=course.id,
                lesson_title=lesson.title,
                course_title=course.title,
                duration_minutes=lesson.duration_minutes,
                created_at=row.created_at,
            )
        )
    return results


def save_note(
    db: Session,
    user_id: int,
    lesson_id: int,
    course_id: int,
    topic: str,
    content: Any,
) -> SavedNote:
    content_str = json.dumps(content) if not isinstance(content, str) else content

    existing = db.scalar(
        select(SavedNote).where(
            SavedNote.user_id == user_id, SavedNote.lesson_id == lesson_id
        )
    )
    if existing is not None:
        existing.topic = topic
        existing.content_json = content_str
        existing.course_id = course_id
        existing.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        return existing

    note = SavedNote(
        user_id=user_id,
        lesson_id=lesson_id,
        course_id=course_id,
        topic=topic,
        content_json=content_str,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def unsave_note(db: Session, user_id: int, lesson_id: int) -> None:
    note = db.scalar(
        select(SavedNote).where(
            SavedNote.user_id == user_id, SavedNote.lesson_id == lesson_id
        )
    )
    if note is not None:
        db.delete(note)
        db.commit()


def get_saved_note(db: Session, user_id: int, lesson_id: int) -> SavedNoteItemResponse | None:
    note = db.scalar(
        select(SavedNote).where(
            SavedNote.user_id == user_id, SavedNote.lesson_id == lesson_id
        )
    )
    if note is None:
        return None
    try:
        content_parsed = json.loads(note.content_json)
    except Exception:
        content_parsed = note.content_json

    lesson = note.lesson
    course = note.course
    return SavedNoteItemResponse(
        id=note.id,
        lesson_id=note.lesson_id,
        course_id=note.course_id,
        topic=note.topic,
        content=content_parsed,
        lesson_title=lesson.title if lesson else "Lesson",
        course_title=course.title if course else "Course",
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


def list_saved_notes(db: Session, user_id: int) -> list[SavedNoteItemResponse]:
    rows = list(
        db.scalars(
            select(SavedNote)
            .where(SavedNote.user_id == user_id)
            .order_by(SavedNote.updated_at.desc())
        )
    )
    results = []
    for note in rows:
        try:
            content_parsed = json.loads(note.content_json)
        except Exception:
            content_parsed = note.content_json

        lesson = note.lesson
        course = note.course
        results.append(
            SavedNoteItemResponse(
                id=note.id,
                lesson_id=note.lesson_id,
                course_id=note.course_id,
                topic=note.topic,
                content=content_parsed,
                lesson_title=lesson.title if lesson else "Lesson",
                course_title=course.title if course else "Course",
                created_at=note.created_at,
                updated_at=note.updated_at,
            )
        )
    return results


def set_course_status(
    db: Session, user_id: int, course_id: int, new_status: str
) -> UserCourseStatus:
    course = db.scalar(select(Course).where(Course.id == course_id))
    if course is None or not course.published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    existing = db.scalar(
        select(UserCourseStatus).where(
            UserCourseStatus.user_id == user_id,
            UserCourseStatus.course_id == course_id,
        )
    )
    if existing is not None:
        existing.status = new_status
        existing.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        return existing

    status_row = UserCourseStatus(
        user_id=user_id,
        course_id=course_id,
        status=new_status,
    )
    db.add(status_row)
    db.commit()
    db.refresh(status_row)
    return status_row


def get_course_statuses_map(db: Session, user_id: int) -> dict[int, str]:
    # 1. Fetch user explicit course statuses
    status_rows = list(
        db.scalars(select(UserCourseStatus).where(UserCourseStatus.user_id == user_id))
    )
    result = {row.course_id: row.status for row in status_rows}

    # 2. Fetch active enrollments to augment / ensure consistency
    from app.services import enrollment_service
    enrollments = enrollment_service.list_student_enrollments(db, user_id)
    for enroll in enrollments:
        total, completed, progress = enrollment_service.compute_course_progress(
            db, user_id, enroll.course_id
        )
        if total > 0 and completed == total:
            result[enroll.course_id] = "COMPLETED"
        elif enroll.course_id not in result or result[enroll.course_id] not in ("PLANNING", "WANT_TO_STUDY"):
            result[enroll.course_id] = "IN_PROGRESS"

    return result


def get_saved_overview(db: Session, user_id: int) -> SavedOverviewResponse:
    saved_course_ids = list(
        db.scalars(select(SavedCourse.course_id).where(SavedCourse.user_id == user_id))
    )
    saved_lesson_ids = list(
        db.scalars(select(SavedLesson.lesson_id).where(SavedLesson.user_id == user_id))
    )
    saved_note_lesson_ids = list(
        db.scalars(select(SavedNote.lesson_id).where(SavedNote.user_id == user_id))
    )
    course_statuses = get_course_statuses_map(db, user_id)

    return SavedOverviewResponse(
        saved_course_ids=saved_course_ids,
        saved_lesson_ids=saved_lesson_ids,
        saved_note_lesson_ids=saved_note_lesson_ids,
        course_statuses=course_statuses,
    )
