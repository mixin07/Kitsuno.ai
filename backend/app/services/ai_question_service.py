from __future__ import annotations

import json
import re

from fastapi import HTTPException, status
from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Lesson, Option, Question, Quiz
from app.schemas.ai import (
    AIGeneratedQuestions,
    AIQuizGenerateRequest,
    AIQuizGenerateResponse,
    GeneratedQuestion,
)
from app.services.ai_provider import AIProviderError, get_ai_provider

_PROMPT_SCHEMA = (
    'Return ONLY a JSON object with the following schema:'
    '{"questions":[{"question_text":"...",'
    '"question_type":"MCQ",'
    '"points":1,'
    '"options":[{"option_text":"...","is_correct":true},'
    '{"option_text":"...","is_correct":false}]}]}.'
    "Each question must have exactly one correct option. "
    "question_type must always be \"MCQ\"."
)


def build_prompt(request: AIQuizGenerateRequest) -> str:
    return (
        "Generate exactly the requested number of multiple-choice questions.\n"
        f"Topic: {request.topic}\n"
        f"Number of questions: {request.number_of_questions}\n"
        f"Difficulty: {request.difficulty.value}\n"
        f"Question type: {request.question_type.value}\n"
        f"{_PROMPT_SCHEMA}"
    )


def _strip_code_fences(text: str) -> str:
    match = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL | re.IGNORECASE)
    return match.group(1).strip() if match else text.strip()


def _parse_provider_output(text: str) -> dict:
    cleaned = _strip_code_fences(text)
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI provider returned malformed JSON",
        ) from exc
    if not isinstance(parsed, dict) or not isinstance(parsed.get("questions"), list):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI provider response did not match the expected schema",
        )
    return parsed


def generate_questions(
    db: Session, lesson_id: int, request: AIQuizGenerateRequest
) -> AIQuizGenerateResponse:
    if request.number_of_questions > settings.ai_max_questions:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"number_of_questions exceeds the maximum of {settings.ai_max_questions}",
        )
    provider = get_ai_provider()
    prompt = build_prompt(request)
    try:
        raw = provider.generate(prompt, request.number_of_questions)
    except AIProviderError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Question generation failed",
        ) from exc

    parsed = _parse_provider_output(raw)
    try:
        validated = AIGeneratedQuestions.model_validate(parsed)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI provider returned questions that failed validation",
        ) from exc

    questions = validated.questions[: request.number_of_questions]
    return AIQuizGenerateResponse(
        lesson_id=lesson_id,
        difficulty=request.difficulty,
        question_type=request.question_type,
        questions=questions,
    )


def get_existing_quiz(db: Session, lesson_id: int) -> Quiz | None:
    return db.scalar(select(Quiz).where(Quiz.lesson_id == lesson_id))


def _next_question_order(db: Session, quiz_id: int) -> int:
    highest = db.scalar(
        select(func.max(Question.order_index)).where(Question.quiz_id == quiz_id)
    )
    return (highest or 0) + 1


def save_generated_questions(
    db: Session, lesson: Lesson, questions: list[GeneratedQuestion]
) -> Quiz:
    """Save approved questions into the lesson quiz, creating it if needed."""
    quiz = get_existing_quiz(db, lesson.id)
    if quiz is None:
        quiz = Quiz(lesson_id=lesson.id, title=f"{lesson.title} Quiz", description=None)
        db.add(quiz)
        db.flush()

    for question_data in questions:
        question = Question(
            quiz_id=quiz.id,
            question_text=question_data.question_text,
            question_type=question_data.question_type.value,
            points=question_data.points,
            order_index=_next_question_order(db, quiz.id),
        )
        db.add(question)
        db.flush()
        for option_index, option_data in enumerate(question_data.options, start=1):
            db.add(
                Option(
                    question_id=question.id,
                    option_text=option_data.option_text,
                    is_correct=option_data.is_correct,
                    order_index=option_index,
                )
            )

    db.commit()
    db.refresh(quiz)
    return quiz