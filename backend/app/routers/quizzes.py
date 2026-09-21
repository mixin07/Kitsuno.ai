from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_student
from app.database import get_db
from app.models import QuizAttempt, User
from app.schemas.quiz import AttemptSummaryResponse, QuizTakeResponse
from app.services import quiz_service

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


@router.get("/{quiz_id}", response_model=QuizTakeResponse)
def get_quiz(
    quiz_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> QuizTakeResponse:
    return quiz_service.get_quiz_for_take(db, current_user.id, quiz_id)


@router.post(
    "/{quiz_id}/attempts",
    response_model=AttemptSummaryResponse,
    status_code=status.HTTP_201_CREATED,
)
def start_attempt(
    quiz_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> QuizAttempt:
    return quiz_service.start_attempt(db, current_user.id, quiz_id)


@router.get("/{quiz_id}/attempts", response_model=list[AttemptSummaryResponse])
def list_attempts(
    quiz_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> list[QuizAttempt]:
    return quiz_service.list_attempts(db, current_user.id, quiz_id)