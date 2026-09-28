from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class OptionTake(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    question_id: int
    option_text: str
    order_index: int


class QuestionTake(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quiz_id: int
    question_text: str
    question_type: str
    points: int
    order_index: int
    options: list[OptionTake]


class QuizTakeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lesson_id: int
    title: str
    description: str | None
    questions: list[QuestionTake]
    total_points: int = 0


class AnswerSubmission(BaseModel):
    question_id: int
    selected_option_id: int | None = None


class AttemptSubmitPayload(BaseModel):
    answers: list[AnswerSubmission] = Field(default_factory=list)


class AttemptSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quiz_id: int
    student_id: int
    score: float
    total_points: float
    percentage: float
    completed_at: datetime | None
    created_at: datetime


class AttemptAnswerView(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    question_id: int
    question_text: str | None = None
    selected_option_id: int | None
    selected_option_text: str | None = None
    correct_option_text: str | None = None
    is_correct: bool
    points_earned: float


class AttemptDetailResponse(AttemptSummaryResponse):
    answers: list[AttemptAnswerView] = Field(default_factory=list)
    quiz_title: str | None = None
    lesson_id: int | None = None