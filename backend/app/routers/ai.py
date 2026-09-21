from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_role
from app.database import get_db
from app.models import User, UserRole
from app.schemas.ai import (
    AIQuizGenerateRequest,
    AIQuizGenerateResponse,
    AISaveRequest,
    AISaveResponse,
)
from app.services import ai_question_service, course_service

router = APIRouter(prefix="/ai/quizzes", tags=["ai"])

MANAGER = require_role(UserRole.INSTRUCTOR, UserRole.ADMIN)


def _managed_lesson(db: Session, lesson_id: int, current_user: User):
    return course_service.get_managed_lesson(db, lesson_id, current_user)


@router.post("/generate", response_model=AIQuizGenerateResponse)
def generate_questions(
    payload: AIQuizGenerateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(MANAGER)],
) -> AIQuizGenerateResponse:
    _managed_lesson(db, payload.lesson_id, current_user)
    return ai_question_service.generate_questions(db, payload.lesson_id, payload)


@router.post("/save", response_model=AISaveResponse, status_code=status.HTTP_201_CREATED)
def save_questions(
    payload: AISaveRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(MANAGER)],
) -> AISaveResponse:
    lesson = _managed_lesson(db, payload.lesson_id, current_user)
    quiz = ai_question_service.save_generated_questions(db, lesson, payload.questions)
    return AISaveResponse(
        lesson_id=lesson.id,
        quiz_id=quiz.id,
        questions=payload.questions,
    )