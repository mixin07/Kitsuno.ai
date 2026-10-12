from __future__ import annotations

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_student
from app.database import get_db
from app.models.user import User
from app.schemas.study_plan import (
    StudyPlanCreate,
    StudyPlanDetailResponse,
    StudyPlanRescheduleRequest,
    StudyPlanResponse,
    StudyPlanTaskCreate,
    StudyPlanTaskResponse,
    StudyPlanTaskUpdate,
    StudyPlanUpdate,
    TodayPlanResponse,
    WeeklyPlanResponse,
)
from app.services import study_plan_service

router = APIRouter(prefix="/study-plans", tags=["study-plans"])


@router.post(
    "",
    response_model=StudyPlanDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create and generate a new study plan",
)
def create_study_plan(
    payload: StudyPlanCreate,
    current_user: Annotated[User, Depends(require_student)],
    db: Annotated[Session, Depends(get_db)],
) -> StudyPlanDetailResponse:
    return study_plan_service.create_and_generate_study_plan(
        db, student_id=current_user.id, payload=payload
    )


@router.get(
    "",
    response_model=list[StudyPlanResponse],
    summary="List all study plans for authenticated student",
)
def list_study_plans(
    current_user: Annotated[User, Depends(require_student)],
    db: Annotated[Session, Depends(get_db)],
) -> list[StudyPlanResponse]:
    return study_plan_service.list_student_study_plans(db, student_id=current_user.id)


@router.get(
    "/today",
    response_model=TodayPlanResponse,
    summary="Get today's tasks and overdue workload",
)
def get_today_plan(
    current_user: Annotated[User, Depends(require_student)],
    db: Annotated[Session, Depends(get_db)],
) -> TodayPlanResponse:
    return study_plan_service.get_today_plan(db, student_id=current_user.id)


@router.get(
    "/weekly",
    response_model=WeeklyPlanResponse,
    summary="Get weekly planner for authenticated student",
)
def get_weekly_plan(
    current_user: Annotated[User, Depends(require_student)],
    db: Annotated[Session, Depends(get_db)],
    week_start: Annotated[date | None, Query(description="Monday of target week")] = None,
) -> WeeklyPlanResponse:
    return study_plan_service.get_weekly_plan(
        db, student_id=current_user.id, week_start=week_start
    )


@router.get(
    "/{plan_id}",
    response_model=StudyPlanDetailResponse,
    summary="Get detailed study plan with tasks",
)
def get_study_plan(
    plan_id: int,
    current_user: Annotated[User, Depends(require_student)],
    db: Annotated[Session, Depends(get_db)],
) -> StudyPlanDetailResponse:
    return study_plan_service.get_study_plan_detail(
        db, student_id=current_user.id, plan_id=plan_id
    )


@router.patch(
    "/{plan_id}",
    response_model=StudyPlanResponse,
    summary="Update study plan metadata",
)
def update_study_plan(
    plan_id: int,
    payload: StudyPlanUpdate,
    current_user: Annotated[User, Depends(require_student)],
    db: Annotated[Session, Depends(get_db)],
) -> StudyPlanResponse:
    return study_plan_service.update_study_plan(
        db, student_id=current_user.id, plan_id=plan_id, payload=payload
    )


@router.delete(
    "/{plan_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a study plan (does not delete curriculum or progress)",
)
def delete_study_plan(
    plan_id: int,
    current_user: Annotated[User, Depends(require_student)],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    study_plan_service.delete_study_plan(db, student_id=current_user.id, plan_id=plan_id)


@router.post(
    "/{plan_id}/reschedule",
    response_model=StudyPlanDetailResponse,
    summary="Reschedule unfinished or overdue tasks in a study plan",
)
def reschedule_study_plan(
    plan_id: int,
    payload: StudyPlanRescheduleRequest,
    current_user: Annotated[User, Depends(require_student)],
    db: Annotated[Session, Depends(get_db)],
) -> StudyPlanDetailResponse:
    return study_plan_service.reschedule_study_plan(
        db, student_id=current_user.id, plan_id=plan_id, payload=payload
    )


@router.post(
    "/tasks/{task_id}/complete",
    response_model=StudyPlanTaskResponse,
    summary="Mark study plan task as completed and synchronize lesson progress",
)
def complete_plan_task(
    task_id: int,
    current_user: Annotated[User, Depends(require_student)],
    db: Annotated[Session, Depends(get_db)],
) -> StudyPlanTaskResponse:
    return study_plan_service.complete_plan_task(
        db, student_id=current_user.id, task_id=task_id
    )


@router.patch(
    "/tasks/{task_id}",
    response_model=StudyPlanTaskResponse,
    summary="Update a specific task in a study plan",
)
def update_plan_task(
    task_id: int,
    payload: StudyPlanTaskUpdate,
    current_user: Annotated[User, Depends(require_student)],
    db: Annotated[Session, Depends(get_db)],
) -> StudyPlanTaskResponse:
    return study_plan_service.update_plan_task(
        db, student_id=current_user.id, task_id=task_id, payload=payload
    )


@router.delete(
    "/tasks/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a specific task from a study plan",
)
def delete_plan_task(
    task_id: int,
    current_user: Annotated[User, Depends(require_student)],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    study_plan_service.delete_plan_task(db, student_id=current_user.id, task_id=task_id)
