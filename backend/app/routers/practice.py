from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_student
from app.database import get_db
from app.models import User
from app.schemas.practice import (
    MockExamCreatePayload,
    MockExamResultResponse,
    MockExamSessionResponse,
    MockExamSessionSummary,
    MockExamSubmitPayload,
    QuestionBankCheckRequest,
    QuestionBankCheckResponse,
    QuestionBankItemView,
    QuestionBankStatsResponse,
    QuizHubSummaryResponse,
)
from app.services import practice_service

router = APIRouter(prefix="/practice", tags=["practice"])


# ==========================================
# 1. QUIZ HUB
# ==========================================

@router.get("/quiz-hub", response_model=QuizHubSummaryResponse)
def get_quiz_hub(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> QuizHubSummaryResponse:
    """List all platform quizzes with authenticated student's attempt history, status, and best scores."""
    return practice_service.get_quiz_hub_summary(db, current_user.id)


# ==========================================
# 2. QUESTION BANK
# ==========================================

@router.get("/question-bank", response_model=list[QuestionBankItemView])
def get_question_bank(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
    course_id: int | None = Query(None, description="Filter by course ID"),
    module_id: int | None = Query(None, description="Filter by module ID"),
    search: str | None = Query(None, description="Search question text"),
    status: str | None = Query("ALL", description="Filter by status: ALL, ANSWERED, UNANSWERED"),
) -> list[QuestionBankItemView]:
    """Retrieve practice questions without exposing answer keys."""
    return practice_service.list_question_bank(
        db, current_user.id, course_id=course_id, module_id=module_id, search=search, status_filter=status
    )


@router.post("/question-bank/check", response_model=QuestionBankCheckResponse)
def check_question(
    payload: QuestionBankCheckRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> QuestionBankCheckResponse:
    """Submit an answer to a single question bank practice question and record practice."""
    return practice_service.check_question_answer(db, current_user.id, payload)


@router.get("/question-bank/stats", response_model=QuestionBankStatsResponse)
def get_question_bank_stats(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> QuestionBankStatsResponse:
    """Return real question bank practice metrics for authenticated student."""
    return practice_service.get_question_bank_stats(db, current_user.id)


# ==========================================
# 3. MOCK EXAMS
# ==========================================

@router.post("/mock-exams", response_model=MockExamSessionResponse, status_code=status.HTTP_201_CREATED)
def create_mock_exam(
    payload: MockExamCreatePayload,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> MockExamSessionResponse:
    """Create a new timed mock exam session populated with real questions."""
    return practice_service.create_mock_exam(db, current_user.id, payload)


@router.get("/mock-exams", response_model=list[MockExamSessionSummary])
def list_mock_exams(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> list[MockExamSessionSummary]:
    """List authenticated student's previous mock exam sessions."""
    return practice_service.list_mock_exam_sessions(db, current_user.id)


@router.get("/mock-exams/{session_id}", response_model=MockExamSessionResponse)
def get_mock_exam(
    session_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> MockExamSessionResponse:
    """Get active mock exam session questions (answers hidden until submitted)."""
    return practice_service.get_mock_exam_session(db, current_user.id, session_id)


@router.post("/mock-exams/{session_id}/submit", response_model=MockExamResultResponse)
def submit_mock_exam(
    session_id: int,
    payload: MockExamSubmitPayload,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> MockExamResultResponse:
    """Submit mock exam answers for server-side evaluation and grading."""
    return practice_service.submit_mock_exam(db, current_user.id, session_id, payload)


@router.get("/mock-exams/{session_id}/result", response_model=MockExamResultResponse)
def get_mock_exam_result(
    session_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> MockExamResultResponse:
    """Retrieve submitted mock exam result breakdown and answer reviews."""
    return practice_service.get_mock_exam_result(db, current_user.id, session_id)
