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
    def exactly_one_correct_option(self) -> "GeneratedQuestion":
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