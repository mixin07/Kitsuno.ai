from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_student
from app.database import get_db
from app.models import User
from app.schemas.saved_item import (
    CourseStatusItemResponse,
    CourseStatusUpdateRequest,
    SavedCourseItemResponse,
    SavedLessonItemResponse,
    SavedNoteCreateRequest,
    SavedNoteItemResponse,
    SavedOverviewResponse,
)
from app.services import saved_service

router = APIRouter(prefix="/saved", tags=["saved"])


@router.get("/overview", response_model=SavedOverviewResponse)
def get_saved_overview(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> SavedOverviewResponse:
    return saved_service.get_saved_overview(db, current_user.id)


# Courses
@router.get("/courses", response_model=list[SavedCourseItemResponse])
def list_saved_courses(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> list[SavedCourseItemResponse]:
    return saved_service.list_saved_courses(db, current_user.id)


@router.post("/courses/{course_id}", status_code=status.HTTP_201_CREATED)
def save_course(
    course_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
):
    saved_service.save_course(db, current_user.id, course_id)
    return {"message": "Course saved", "course_id": course_id}


@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_course(
    course_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> None:
    saved_service.unsave_course(db, current_user.id, course_id)


# Lessons
@router.get("/lessons", response_model=list[SavedLessonItemResponse])
def list_saved_lessons(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> list[SavedLessonItemResponse]:
    return saved_service.list_saved_lessons(db, current_user.id)


@router.post("/lessons/{lesson_id}", status_code=status.HTTP_201_CREATED)
def save_lesson(
    lesson_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
):
    saved_service.save_lesson(db, current_user.id, lesson_id)
    return {"message": "Lesson saved", "lesson_id": lesson_id}


@router.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_lesson(
    lesson_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> None:
    saved_service.unsave_lesson(db, current_user.id, lesson_id)


# Notes
@router.get("/notes", response_model=list[SavedNoteItemResponse])
def list_saved_notes(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> list[SavedNoteItemResponse]:
    return saved_service.list_saved_notes(db, current_user.id)


@router.get("/notes/{lesson_id}", response_model=SavedNoteItemResponse)
def get_saved_note(
    lesson_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> SavedNoteItemResponse:
    note = saved_service.get_saved_note(db, current_user.id, lesson_id)
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved note not found")
    return note


@router.post("/notes", response_model=SavedNoteItemResponse, status_code=status.HTTP_201_CREATED)
def save_note(
    payload: SavedNoteCreateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> SavedNoteItemResponse:
    saved_service.save_note(
        db,
        current_user.id,
        payload.lesson_id,
        payload.course_id,
        payload.topic,
        payload.content,
    )
    note = saved_service.get_saved_note(db, current_user.id, payload.lesson_id)
    return note


@router.delete("/notes/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_note(
    lesson_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> None:
    saved_service.unsave_note(db, current_user.id, lesson_id)


# Course Status (Planning, Want to Study, etc.)
@router.get("/status")
def get_course_statuses(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> dict[int, str]:
    return saved_service.get_course_statuses_map(db, current_user.id)


@router.put("/status/{course_id}", response_model=CourseStatusItemResponse)
def update_course_status(
    course_id: int,
    payload: CourseStatusUpdateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> CourseStatusItemResponse:
    row = saved_service.set_course_status(db, current_user.id, course_id, payload.status)
    return CourseStatusItemResponse(
        course_id=row.course_id,
        status=row.status,
        updated_at=row.updated_at,
    )
