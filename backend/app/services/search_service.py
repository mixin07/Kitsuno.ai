from __future__ import annotations

import re
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Course, Lesson, Module, Quiz
from app.schemas.search import SearchResponse, SearchResultItem


def _normalize_tokens(text: str) -> list[str]:
    """Extract lowercase words/tokens from text."""
    clean = re.sub(r"[^\w\s]", " ", (text or "").lower())
    tokens = [t.strip() for t in clean.split() if len(t.strip()) > 1]
    return tokens


def search_learning_content(db: Session, query: str) -> SearchResponse:
    """
    Search real published courses, modules, lessons, and quizzes using natural language.
    Ranks results deterministically without fabricating content.
    """
    q_raw = (query or "").strip()
    if not q_raw:
        return SearchResponse(query="", interpreted_query="", total_results=0, results=[])

    q_lower = q_raw.lower()
    query_tokens = set(_normalize_tokens(q_raw))
    query_phrase = q_lower

    # Fetch all published courses with hierarchy efficiently via selectinload
    courses = list(
        db.scalars(
            select(Course)
            .where(Course.published.is_(True))
            .options(
                selectinload(Course.modules)
                .selectinload(Module.lessons)
                .selectinload(Lesson.quiz)
            )
            .order_by(Course.id)
        ).all()
    )

    scored_items: list[tuple[float, SearchResultItem]] = []

    for course in courses:
        c_title_lower = course.title.lower()
        c_desc_lower = (course.description or "").lower()
        c_tokens = set(_normalize_tokens(course.title)) | set(_normalize_tokens(course.description or ""))
        c_overlap = len(query_tokens & c_tokens)

        # 1. Evaluate Course
        c_score = 0.0
        if query_phrase == c_title_lower:
            c_score += 100.0
        elif query_phrase in c_title_lower:
            c_score += 60.0
        elif c_overlap > 0:
            c_score += c_overlap * 15.0

        if query_phrase in c_desc_lower:
            c_score += 20.0

        if c_score > 0:
            scored_items.append(
                (
                    c_score,
                    SearchResultItem(
                        id=f"course-{course.id}",
                        title=course.title,
                        content_type="COURSE",
                        course_id=course.id,
                        course_title=course.title,
                        description=course.description or f"Comprehensive course in {course.category or 'Web Development'}.",
                        action_label="View Course",
                        action_url=f"/courses/{course.id}",
                        relevance_score=c_score,
                        category=course.category,
                    ),
                )
            )

        # 2. Evaluate Modules, Lessons & Quizzes
        for module in course.modules:
            m_title_lower = module.title.lower()
            m_desc_lower = (module.description or "").lower()
            m_tokens = set(_normalize_tokens(module.title))
            m_overlap = len(query_tokens & m_tokens)

            m_score = 0.0
            if query_phrase == m_title_lower:
                m_score += 80.0
            elif query_phrase in m_title_lower:
                m_score += 45.0
            elif m_overlap > 0:
                m_score += m_overlap * 12.0

            if query_phrase in m_desc_lower:
                m_score += 15.0

            if m_score > 0:
                scored_items.append(
                    (
                        m_score,
                        SearchResultItem(
                            id=f"module-{module.id}",
                            title=module.title,
                            content_type="MODULE",
                            course_id=course.id,
                            course_title=course.title,
                            module_id=module.id,
                            module_title=module.title,
                            description=module.description or f"Module {module.order_number} of {course.title}.",
                            action_label="Open Module",
                            action_url=f"/courses/{course.id}",
                            relevance_score=m_score,
                            category=course.category,
                        ),
                    )
                )

            for lesson in module.lessons:
                l_title_lower = lesson.title.lower()
                l_desc_lower = (lesson.description or "").lower()
                l_content_lower = (lesson.content or "").lower()
                l_tokens = set(_normalize_tokens(lesson.title))
                l_overlap = len(query_tokens & l_tokens)

                l_score = 0.0
                if query_phrase == l_title_lower:
                    l_score += 90.0
                elif query_phrase in l_title_lower:
                    l_score += 50.0
                elif l_overlap > 0:
                    l_score += l_overlap * 14.0

                if query_phrase in l_desc_lower:
                    l_score += 18.0
                elif l_overlap == 0 and any(t in l_desc_lower for t in query_tokens):
                    l_score += 10.0

                if query_phrase in l_content_lower:
                    l_score += 8.0

                # Also give small relevance boost if the course or module matches the query
                if (query_phrase in c_title_lower or query_phrase in m_title_lower) and l_score > 0:
                    l_score += 10.0

                if l_score > 0:
                    scored_items.append(
                        (
                            l_score,
                            SearchResultItem(
                                id=f"lesson-{lesson.id}",
                                title=lesson.title,
                                content_type="LESSON",
                                course_id=course.id,
                                course_title=course.title,
                                module_id=module.id,
                                module_title=module.title,
                                lesson_id=lesson.id,
                                lesson_title=lesson.title,
                                description=lesson.description or f"Lesson {lesson.order_number} in {module.title}.",
                                action_label="Open Lesson",
                                action_url=f"/courses/{course.id}/lessons/{lesson.id}",
                                relevance_score=l_score,
                                category=course.category,
                            ),
                        )
                    )

                # 3. Evaluate Quiz attached to lesson
                if lesson.quiz:
                    quiz = lesson.quiz
                    qz_title_lower = quiz.title.lower()
                    qz_desc_lower = (quiz.description or "").lower()
                    qz_tokens = set(_normalize_tokens(quiz.title))
                    qz_overlap = len(query_tokens & qz_tokens)

                    qz_score = 0.0
                    # Check if query mentions 'quiz' or 'test' or matches title
                    has_quiz_intent = any(word in query_tokens for word in ["quiz", "test", "exam", "assessment", "practice"])

                    if query_phrase == qz_title_lower:
                        qz_score += 95.0
                    elif query_phrase in qz_title_lower:
                        qz_score += 55.0
                    elif qz_overlap > 0:
                        qz_score += qz_overlap * 16.0

                    if has_quiz_intent and (query_tokens & (c_tokens | m_tokens | l_tokens)):
                        qz_score += 40.0

                    if query_phrase in qz_desc_lower:
                        qz_score += 15.0

                    if qz_score > 0:
                        scored_items.append(
                            (
                                qz_score,
                                SearchResultItem(
                                    id=f"quiz-{quiz.id}",
                                    title=quiz.title,
                                    content_type="QUIZ",
                                    course_id=course.id,
                                    course_title=course.title,
                                    module_id=module.id,
                                    module_title=module.title,
                                    lesson_id=lesson.id,
                                    lesson_title=lesson.title,
                                    quiz_id=quiz.id,
                                    description=quiz.description or f"Assessment quiz with {len(quiz.questions)} questions for {lesson.title}.",
                                    action_label="Open Quiz",
                                    action_url=f"/student/quiz/{quiz.id}?courseId={course.id}&lessonId={lesson.id}",
                                    relevance_score=qz_score,
                                    category=course.category,
                                ),
                            )
                        )

    # Sort descending by relevance score
    scored_items.sort(key=lambda x: x[0], reverse=True)

    # Remove duplicates by item id
    seen_ids = set()
    final_results: list[SearchResultItem] = []
    for _, item in scored_items:
        if item.id not in seen_ids:
            seen_ids.add(item.id)
            final_results.append(item)
            if len(final_results) >= 20:
                break

    return SearchResponse(
        query=q_raw,
        interpreted_query=f"Searching for learning resources matching: '{q_raw}'",
        total_results=len(final_results),
        results=final_results,
    )
