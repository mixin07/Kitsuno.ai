from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_role
from app.database import get_db
from app.models import Course, User, UserRole
from app.schemas.course import CourseCreate, CourseResponse, CourseUpdate
from app.services import course_service

router = APIRouter(prefix="/courses", tags=["courses"])


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    payload: CourseCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.INSTRUCTOR, UserRole.ADMIN))],
) -> Course:
    course = Course(
        title=payload.title,
        description=payload.description,
        thumbnail_url=payload.thumbnail_url,
        category=payload.category,
        difficulty=payload.difficulty,
        instructor_id=current_user.id,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.get("", response_model=list[CourseResponse])
def list_courses(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[Course]:
    return course_service.list_visible_courses(db, current_user)


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(
    course_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Course:
    return course_service.get_visible_course(db, course_id, current_user)


@router.patch("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    payload: CourseUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Course:
    course = course_service.require_course_manager(db, course_id, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(course, field, value)
    db.commit()
    db.refresh(course)
    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    course_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    course = course_service.require_course_manager(db, course_id, current_user)
    db.delete(course)
    db.commit()


@router.post("/{course_id}/publish", response_model=CourseResponse)
def publish_course(
    course_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Course:
    course = course_service.require_course_manager(db, course_id, current_user)
    course_service.ensure_publishable(db, course)
    course.published = True
    db.commit()
    db.refresh(course)
    return course


@router.post("/{course_id}/unpublish", response_model=CourseResponse)
def unpublish_course(
    course_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Course:
    course = course_service.require_course_manager(db, course_id, current_user)
    course.published = False
    db.commit()
    db.refresh(course)
    return course