from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_role
from app.database import get_db
from app.models import User, UserRole
from app.schemas.gamification import StudentGamificationResponse
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
