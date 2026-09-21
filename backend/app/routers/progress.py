from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import require_student
from app.database import get_db
from app.models import LessonProgress, User
from app.schemas.learning import CourseProgressResponse, LessonProgressResponse, LessonProgressUpdate
from app.services import progress_service

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/courses/{course_id}", response_model=CourseProgressResponse)
def get_course_progress(
    course_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> CourseProgressResponse:
    return progress_service.get_course_progress_summary(db, current_user.id, course_id)


@router.get("/lessons/{lesson_id}", response_model=LessonProgressResponse)
def get_lesson_progress(
    lesson_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> LessonProgressResponse:
    return progress_service.get_lesson_progress(db, current_user.id, lesson_id)


@router.put("/lessons/{lesson_id}", response_model=LessonProgressResponse)
def update_lesson_progress(
    lesson_id: int,
    payload: LessonProgressUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> LessonProgress:
    return progress_service.update_lesson_progress(db, current_user.id, lesson_id, payload)