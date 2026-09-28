from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Course, Lesson, Module
from app.schemas.ai import (
    AIChatRequest,
    AIChatResponse,
    AILessonNotesResponse,
    AILessonSummaryResponse,
    AIStudyAssistantAction,
    AIStudyAssistantRequest,
    AIStudyAssistantResponse,
)
from app.services import enrollment_service
from app.services.ai_provider import AIProviderError, get_ai_provider

SYSTEM_STUDY_PROMPT = (
    "You are Kitsuno.ai's AI Study Assistant, an encouraging, expert educational tutor. "
    "Your primary goal is to help the student master the concepts taught in the CURRENT LESSON. "
    "Always explain concepts simply, accurately, and concisely based on the lesson context provided. "
    "If the user asks about something completely unrelated to the lesson or course domain, "
    "politely respond with: 'That's outside this lesson's scope. I can help you with the concepts covered here.' "
    "Do not claim to know information that is not supported by the lesson or web development best practices."
)

SYSTEM_GLOBAL_CHAT_PROMPT = (
    "You are Kitsuno.ai's AI Tutor, a warm, intelligent, encouraging educational study companion. "
    "Help the student understand programming concepts, course topics, revision strategies, and learning doubts. "
    "Give clear, well-structured, beginner-friendly answers. Use formatting, code snippets, or bullet points where appropriate. "
    "Be supportive and academic in tone."
)


def _load_lesson_context(db: Session, student_id: int, lesson_id: int) -> tuple[Lesson, Module, Course]:
    """Retrieve lesson from DB, verifying that the course is published and the student is enrolled."""
    row = db.execute(
        select(Lesson, Module, Course)
        .join(Module, Lesson.module_id == Module.id)
        .join(Course, Module.course_id == Course.id)
        .where(Lesson.id == lesson_id)
    ).first()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found",
        )

    lesson, module, course = row[0], row[1], row[2]

    if not course.published:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course is not published",
        )

    enrollment_service.require_enrollment(db, student_id, course.id)
    return lesson, module, course


def ask_study_assistant(
    db: Session, student_id: int, request: AIStudyAssistantRequest
) -> AIStudyAssistantResponse:
    lesson, module, course = _load_lesson_context(db, student_id, request.lesson_id)

    # Build contextual prompt
    context_str = (
        f"Course: {course.title}\n"
        f"Module: {module.title}\n"
        f"Lesson: {lesson.title}\n"
        f"Description: {lesson.description or 'N/A'}\n"
        f"Content: {lesson.content or 'N/A'}\n"
    )

    action_instructions = {
        AIStudyAssistantAction.EXPLAIN: "Provide a clear, beginner-friendly explanation of the core concepts in this lesson.",
        AIStudyAssistantAction.SUMMARIZE: "Provide a concise bullet-point summary of the key takeaways from this lesson.",
        AIStudyAssistantAction.EXAMPLE: "Provide a practical, real-world code example illustrating what is taught in this lesson.",
        AIStudyAssistantAction.QUIZ_ME: "Ask a quick 1-question practice scenario/question based on this lesson to test my understanding, followed by a hint.",
        AIStudyAssistantAction.CHAT: request.message or "Help me understand this lesson.",
    }

    instruction = action_instructions.get(request.action, request.message or "Help me understand this lesson.")

    full_prompt = (
        f"LESSON CONTEXT:\n{context_str}\n\n"
        f"ACTION: {request.action.value}\n"
        f"USER QUESTION: {instruction}"
    )

    history_dicts = [{"role": msg.role.value, "content": msg.content} for msg in request.chat_history]

    provider = get_ai_provider()
    try:
        reply = provider.chat(
            prompt=full_prompt,
            system_prompt=SYSTEM_STUDY_PROMPT,
            history=history_dicts,
        )
    except AIProviderError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI Study Assistant service is currently unavailable.",
        ) from exc

    return AIStudyAssistantResponse(
        lesson_id=lesson.id,
        action=request.action,
        reply=reply,
    )


def chat_with_kitsuno(
    db: Session, student_id: int, request: AIChatRequest
) -> AIChatResponse:
    course_title = None
    lesson_title = None
    context_str = ""

    if request.lesson_id:
        lesson, _module, course = _load_lesson_context(db, student_id, request.lesson_id)
        course_title = course.title
        lesson_title = lesson.title
        context_str = (
            f"STUDENT CONTEXT:\nCourse: {course.title}\nLesson: {lesson.title}\n"
            f"Lesson Content: {lesson.content or 'N/A'}\n\n"
        )
    elif request.course_id:
        course = enrollment_service.get_published_course(db, request.course_id)
        enrollment_service.require_enrollment(db, student_id, course.id)
        course_title = course.title
        context_str = f"STUDENT CONTEXT:\nCourse: {course.title}\n\n"

    full_prompt = f"{context_str}USER QUESTION: {request.message}"
    history_dicts = [{"role": msg.role.value, "content": msg.content} for msg in request.conversation]

    provider = get_ai_provider()
    try:
        reply = provider.chat(
            prompt=full_prompt,
            system_prompt=SYSTEM_GLOBAL_CHAT_PROMPT,
            history=history_dicts,
        )

        from app.services import gamification_service
        gamification_service.on_ai_interaction(db, student_id)
    except AIProviderError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Kitsuno AI chat service is currently unavailable.",
        ) from exc

    return AIChatResponse(
        reply=reply,
        course_title=course_title,
        lesson_title=lesson_title,
    )


def generate_lesson_summary(
    db: Session, student_id: int, lesson_id: int
) -> AILessonSummaryResponse:
    lesson, _module, _course = _load_lesson_context(db, student_id, lesson_id)
    provider = get_ai_provider()
    try:
        data = provider.generate_summary(
            lesson_title=lesson.title,
            content=lesson.content or lesson.description or "",
        )
    except AIProviderError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI Summary service is currently unavailable.",
        ) from exc

    return AILessonSummaryResponse(
        lesson_id=lesson.id,
        summary=data.get("summary", f"Summary of {lesson.title}"),
        key_concepts=data.get("key_concepts", []),
        takeaways=data.get("takeaways", []),
    )


def generate_lesson_notes(
    db: Session, student_id: int, lesson_id: int
) -> AILessonNotesResponse:
    lesson, _module, _course = _load_lesson_context(db, student_id, lesson_id)
    provider = get_ai_provider()
    try:
        data = provider.generate_notes(
            lesson_title=lesson.title,
            content=lesson.content or lesson.description or "",
        )
    except AIProviderError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI Study Notes service is currently unavailable.",
        ) from exc

    return AILessonNotesResponse(
        lesson_id=lesson.id,
        topic=data.get("topic", lesson.title),
        topic_overview=data.get("topic_overview", f"Comprehensive study guide covering foundational and practical concepts of {lesson.title}."),
        core_concepts=data.get("core_concepts", []),
        definitions=data.get("definitions", []),
        syntax_rules=data.get("syntax_rules", []),
        examples=data.get("examples", []),
        step_by_step=data.get("step_by_step", []),
        common_mistakes=data.get("common_mistakes", []),
        important_points=data.get("important_points", []),
        quick_revision=data.get("quick_revision", []),
    )
