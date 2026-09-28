from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import require_student
from app.database import get_db
from app.models import User
from app.schemas.recommendation import StudentRecommendationResponse
from app.services import recommendation_service

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/student", response_model=StudentRecommendationResponse)
def get_student_recommendation(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> StudentRecommendationResponse:
    return recommendation_service.get_student_recommendation(db, current_user.id)
