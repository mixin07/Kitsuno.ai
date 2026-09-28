from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_role, require_student
from app.database import get_db
from app.models import User, UserRole
from app.schemas.ai import (
    AIChatRequest,
    AIChatResponse,
    AILessonNotesResponse,
    AILessonSummaryResponse,
    AIQuizGenerateRequest,
    AIQuizGenerateResponse,
    AISaveRequest,
    AISaveResponse,
    AIStudyAssistantRequest,
    AIStudyAssistantResponse,
)
from app.services import ai_assistant_service, ai_question_service, course_service

router = APIRouter(prefix="/ai", tags=["ai"])

MANAGER = require_role(UserRole.INSTRUCTOR, UserRole.ADMIN)


def _managed_lesson(db: Session, lesson_id: int, current_user: User):
    return course_service.get_managed_lesson(db, lesson_id, current_user)


@router.post("/quizzes/generate", response_model=AIQuizGenerateResponse)
def generate_questions(
    payload: AIQuizGenerateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(MANAGER)],
) -> AIQuizGenerateResponse:
    _managed_lesson(db, payload.lesson_id, current_user)
    return ai_question_service.generate_questions(db, payload.lesson_id, payload)


@router.post("/quizzes/save", response_model=AISaveResponse, status_code=status.HTTP_201_CREATED)
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


@router.post("/study-assistant", response_model=AIStudyAssistantResponse)
def study_assistant(
    payload: AIStudyAssistantRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> AIStudyAssistantResponse:
    return ai_assistant_service.ask_study_assistant(db, current_user.id, payload)


@router.post("/chat", response_model=AIChatResponse)
def chat_with_kitsuno(
    payload: AIChatRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> AIChatResponse:
    return ai_assistant_service.chat_with_kitsuno(db, current_user.id, payload)


@router.post("/lessons/{lesson_id}/summary", response_model=AILessonSummaryResponse)
def generate_lesson_summary(
    lesson_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> AILessonSummaryResponse:
    return ai_assistant_service.generate_lesson_summary(db, current_user.id, lesson_id)


@router.post("/lessons/{lesson_id}/notes", response_model=AILessonNotesResponse)
def generate_lesson_notes(
    lesson_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> AILessonNotesResponse:
    return ai_assistant_service.generate_lesson_notes(db, current_user.id, lesson_id)