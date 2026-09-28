from __future__ import annotations

import enum

from pydantic import BaseModel, Field, model_validator


class AIQuestionDifficulty(str, enum.Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"


class AIQuestionType(str, enum.Enum):
    MCQ = "MCQ"


class AIQuizGenerateRequest(BaseModel):
    lesson_id: int
    topic: str = Field(min_length=3, max_length=2000)
    number_of_questions: int = Field(ge=1, le=20)
    difficulty: AIQuestionDifficulty = AIQuestionDifficulty.MEDIUM
    question_type: AIQuestionType = AIQuestionType.MCQ


class GeneratedOption(BaseModel):
    option_text: str = Field(min_length=1, max_length=500)
    is_correct: bool = False


class GeneratedQuestion(BaseModel):
    question_text: str = Field(min_length=1, max_length=1000)
    question_type: AIQuestionType = AIQuestionType.MCQ
    points: int = Field(ge=1, le=100)
    options: list[GeneratedOption] = Field(min_length=2, max_length=10)

    @model_validator(mode="after")
    def exactly_one_correct_option(self) -> GeneratedQuestion:
        correct_options = [option for option in self.options if option.is_correct]
        if len(correct_options) != 1:
            raise ValueError("Each question must have exactly one correct option")
        return self


class AIGeneratedQuestions(BaseModel):
    questions: list[GeneratedQuestion] = Field(min_length=1, max_length=20)


class AIQuizGenerateResponse(BaseModel):
    lesson_id: int
    difficulty: AIQuestionDifficulty
    question_type: AIQuestionType
    questions: list[GeneratedQuestion]


class AISaveRequest(BaseModel):
    lesson_id: int
    questions: list[GeneratedQuestion] = Field(min_length=1, max_length=20)


class AISaveResponse(BaseModel):
    lesson_id: int
    quiz_id: int
    questions: list[GeneratedQuestion]


# --- AI Study Assistant Schemas ---

class AIStudyAssistantAction(str, enum.Enum):
    CHAT = "CHAT"
    EXPLAIN = "EXPLAIN"
    SUMMARIZE = "SUMMARIZE"
    EXAMPLE = "EXAMPLE"
    QUIZ_ME = "QUIZ_ME"


class ChatMessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatMessageItem(BaseModel):
    role: ChatMessageRole
    content: str = Field(min_length=1, max_length=4000)


class AIStudyAssistantRequest(BaseModel):
    lesson_id: int
    action: AIStudyAssistantAction = AIStudyAssistantAction.CHAT
    message: str | None = Field(default=None, max_length=2000)
    chat_history: list[ChatMessageItem] = Field(default_factory=list, max_length=10)


class AIStudyAssistantResponse(BaseModel):
    lesson_id: int
    action: AIStudyAssistantAction
    reply: str


# --- Phase 9: Global AI Chat Schemas ---

class AIChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    conversation: list[ChatMessageItem] = Field(default_factory=list, max_length=20)
    course_id: int | None = None
    lesson_id: int | None = None


class AIChatResponse(BaseModel):
    reply: str
    course_title: str | None = None
    lesson_title: str | None = None


# --- Phase 9: AI Lesson Summary Schemas ---

class AILessonSummaryResponse(BaseModel):
    lesson_id: int
    summary: str
    key_concepts: list[str]
    takeaways: list[str]


# --- Phase 9: AI Study Notes Schemas ---

class AILessonNotesResponse(BaseModel):
    lesson_id: int
    topic: str
    topic_overview: str | None = None
    core_concepts: list[str] = Field(default_factory=list)
    definitions: list[str] = Field(default_factory=list)
    syntax_rules: list[str] = Field(default_factory=list)
    examples: list[str] = Field(default_factory=list)
    step_by_step: list[str] = Field(default_factory=list)
    common_mistakes: list[str] = Field(default_factory=list)
    important_points: list[str] = Field(default_factory=list)
    quick_revision: list[str] = Field(default_factory=list)