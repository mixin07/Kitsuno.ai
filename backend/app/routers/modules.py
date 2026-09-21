from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database import get_db
from app.models import Module, User
from app.schemas.course import ModuleCreate, ModuleResponse, ModuleUpdate
from app.services import course_service

router = APIRouter(prefix="/courses", tags=["modules"])


@router.post(
    "/{course_id}/modules",
    response_model=ModuleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_module(
    course_id: int,
    payload: ModuleCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Module:
    course_service.require_course_manager(db, course_id, current_user)
    module = Module(
        course_id=course_id,
        title=payload.title,
        description=payload.description,
        order_number=payload.order_number or course_service.next_module_order(db, course_id),
    )
    db.add(module)
    db.commit()
    db.refresh(module)
    return module


@router.get("/{course_id}/modules", response_model=list[ModuleResponse])
def list_modules(
    course_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[Module]:
    course_service.get_visible_course(db, course_id, current_user)
    return course_service.list_modules_by_course(db, course_id)


@router.patch("/{course_id}/modules/{module_id}", response_model=ModuleResponse)
def update_module(
    course_id: int,
    module_id: int,
    payload: ModuleUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Module:
    module = course_service.get_module_for_course(db, module_id, course_id, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(module, field, value)
    db.commit()
    db.refresh(module)
    return module


@router.delete(
    "/{course_id}/modules/{module_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_module(
    course_id: int,
    module_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    module = course_service.get_module_for_course(db, module_id, course_id, current_user)
    db.delete(module)
    db.commit()