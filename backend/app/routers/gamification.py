from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_role
from app.database import get_db
from app.models import User, UserRole
from app.schemas.gamification import (
    LevelDetailsResponse,
    MonthlyActivityResponse,
    StreakDetailsResponse,
    StudentGamificationResponse,
    XpSummaryResponse,
)
from app.services import gamification_service

router = APIRouter(prefix="/gamification", tags=["gamification"])


@router.get(
    "/me",
    response_model=StudentGamificationResponse,
)
def get_my_gamification_status(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN))],
) -> StudentGamificationResponse:
    """Return student gamification profile (XP, level, streak, quests, achievements, logs)."""
    return gamification_service.get_student_gamification(db, current_user.id)


@router.get(
    "/streak",
    response_model=StreakDetailsResponse,
)
def get_my_streak_details(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN))],
) -> StreakDetailsResponse:
    """Return real streak metrics, active status, and contributing learning activity."""
    return gamification_service.get_streak_details(db, current_user.id)


@router.get(
    "/xp-summary",
    response_model=XpSummaryResponse,
)
def get_my_xp_summary(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN))],
) -> XpSummaryResponse:
    """Return real XP stats, weekly/daily breakdowns, and gamification activity log."""
    return gamification_service.get_xp_summary(db, current_user.id)


@router.get(
    "/level-details",
    response_model=LevelDetailsResponse,
)
def get_my_level_details(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN))],
) -> LevelDetailsResponse:
    """Return real level progression timeline, progress to next level, and thresholds."""
    return gamification_service.get_level_details(db, current_user.id)


@router.get(
    "/monthly-activity",
    response_model=MonthlyActivityResponse,
)
def get_my_monthly_activity(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN))],
    year: int | None = None,
    month: int | None = None,
) -> MonthlyActivityResponse:
    """Return calendar activity for a specific month for the authenticated student."""
    return gamification_service.get_monthly_activity(db, current_user.id, year, month)

