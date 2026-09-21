from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import require_student
from app.database import get_db
from app.models import User
from app.schemas.quiz import AttemptDetailResponse, AttemptSubmitPayload
from app.services import quiz_service

router = APIRouter(prefix="/attempts", tags=["attempts"])


@router.get("/{attempt_id}", response_model=AttemptDetailResponse)
def get_attempt(
    attempt_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> AttemptDetailResponse:
    attempt = quiz_service.get_attempt(db, current_user.id, attempt_id)
    return quiz_service.build_attempt_detail(attempt)


@router.post("/{attempt_id}/submit", response_model=AttemptDetailResponse)
def submit_attempt(
    attempt_id: int,
    payload: AttemptSubmitPayload,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> AttemptDetailResponse:
    attempt = quiz_service.submit_attempt(db, current_user.id, attempt_id, payload)
    return quiz_service.build_attempt_detail(attempt)