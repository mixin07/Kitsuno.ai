from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


# ==========================================
# QUIZ HUB SCHEMAS
# ==========================================

class QuizHubItemResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    lesson_id: int
    lesson_title: str
    module_id: int
    module_title: str
    course_id: int
    course_title: str
    course_category: str | None = None
    question_count: int
    total_points: float
    attempt_count: int = 0
    best_score: float = 0.0
    best_percentage: float = 0.0
    last_attempt_id: int | None = None
    status: str = "NOT_ATTEMPTED"  # NOT_ATTEMPTED, IN_PROGRESS, COMPLETED
    passed: bool = False
    is_enrolled: bool = False

    model_config = ConfigDict(from_attributes=True)


class QuizHubSummaryResponse(BaseModel):
    total_quizzes: int
    completed_quizzes: int
    in_progress_quizzes: int
    not_attempted_quizzes: int
    passed_quizzes: int
    quizzes: list[QuizHubItemResponse]


# ==========================================
# QUESTION BANK SCHEMAS
# ==========================================

class QuestionBankOptionView(BaseModel):
    id: int
    option_text: str
    order_index: int

    model_config = ConfigDict(from_attributes=True)


class QuestionBankItemView(BaseModel):
    id: int
    quiz_id: int
    question_text: str
    question_type: str
    points: int
    order_index: int
    course_id: int
    course_title: str
    module_id: int
    module_title: str
    lesson_id: int
    lesson_title: str
    options: list[QuestionBankOptionView]
    has_practiced: bool = False
    last_is_correct: bool | None = None
    last_selected_option_id: int | None = None

    model_config = ConfigDict(from_attributes=True)


class QuestionBankCheckRequest(BaseModel):
    question_id: int
    selected_option_id: int


class QuestionBankCheckResponse(BaseModel):
    question_id: int
    selected_option_id: int
    is_correct: bool
    correct_option_id: int
    explanation: str | None = None


class QuestionBankStatsResponse(BaseModel):
    questions_practiced: int
    correct: int
    incorrect: int
    accuracy_percentage: float


# ==========================================
# MOCK EXAM SCHEMAS
# ==========================================

class MockExamCreatePayload(BaseModel):
    course_id: int | None = None  # None = All Courses
    question_count: int = Field(default=10, ge=5, le=30)
    duration_minutes: int = Field(default=10, ge=5, le=60)


class MockExamQuestionTake(BaseModel):
    id: int
    order_index: int
    question_text: str
    points: int
    options: list[QuestionBankOptionView]
    selected_option_id: int | None = None


class MockExamSessionResponse(BaseModel):
    id: int
    title: str
    course_id: int | None = None
    course_title: str | None = None
    question_count: int
    duration_minutes: int
    started_at: datetime
    submitted_at: datetime | None = None
    status: str  # IN_PROGRESS, SUBMITTED, EXPIRED
    score: float = 0.0
    total_points: float = 0.0
    percentage: float = 0.0
    time_spent_seconds: int | None = None
    questions: list[MockExamQuestionTake]

    model_config = ConfigDict(from_attributes=True)


class MockExamAnswerItem(BaseModel):
    question_id: int
    selected_option_id: int | None = None


class MockExamSubmitPayload(BaseModel):
    answers: list[MockExamAnswerItem]


class MockExamQuestionReview(BaseModel):
    question_id: int
    question_text: str
    points: int
    selected_option_id: int | None = None
    selected_option_text: str | None = None
    correct_option_id: int
    correct_option_text: str
    is_correct: bool
    points_earned: float
    options: list[QuestionBankOptionView]


class MockExamResultResponse(BaseModel):
    id: int
    title: str
    course_title: str | None = None
    question_count: int
    duration_minutes: int
    started_at: datetime
    submitted_at: datetime | None = None
    status: str
    score: float
    total_points: float
    percentage: float
    correct_count: int
    incorrect_count: int
    unanswered_count: int
    time_spent_seconds: int
    passed: bool
    reviews: list[MockExamQuestionReview]


class MockExamSessionSummary(BaseModel):
    id: int
    title: str
    course_id: int | None = None
    course_title: str | None = None
    question_count: int
    duration_minutes: int
    started_at: datetime
    submitted_at: datetime | None = None
    status: str
    score: float
    total_points: float
    percentage: float
    passed: bool

    model_config = ConfigDict(from_attributes=True)
