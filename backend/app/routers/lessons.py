from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database import get_db
from app.models import Lesson, User
from app.schemas.course import LessonCreate, LessonResponse, LessonUpdate
from app.services import course_service

router = APIRouter(prefix="/courses", tags=["lessons"])


@router.post(
    "/{course_id}/modules/{module_id}/lessons",
    response_model=LessonResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_lesson(
    course_id: int,
    module_id: int,
    payload: LessonCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Lesson:
    module = course_service.get_module_for_course(db, module_id, course_id, current_user)
    lesson = Lesson(
        module_id=module.id,
        title=payload.title,
        description=payload.description,
        content=payload.content,
        video_url=payload.video_url,
        resource_url=payload.resource_url,
        duration_minutes=payload.duration_minutes,
        order_number=payload.order_number or course_service.next_lesson_order(db, module_id),
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.get(
    "/{course_id}/modules/{module_id}/lessons", response_model=list[LessonResponse]
)
def list_lessons(
    course_id: int,
    module_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[Lesson]:
    course_service.get_visible_course(db, course_id, current_user)
    module = course_service.find_module_in_course(db, module_id, course_id)
    return course_service.list_lessons_by_module(db, module.id)


@router.patch(
    "/{course_id}/modules/{module_id}/lessons/{lesson_id}",
    response_model=LessonResponse,
)
def update_lesson(
    course_id: int,
    module_id: int,
    lesson_id: int,
    payload: LessonUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Lesson:
    lesson = course_service.get_lesson_for_module(
        db, lesson_id, module_id, course_id, current_user
    )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(lesson, field, value)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.delete(
    "/{course_id}/modules/{module_id}/lessons/{lesson_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_lesson(
    course_id: int,
    module_id: int,
    lesson_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    lesson = course_service.get_lesson_for_module(
        db, lesson_id, module_id, course_id, current_user
    )
    db.delete(lesson)
    db.commit()