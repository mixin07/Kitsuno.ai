from __future__ import annotations

from datetime import datetime, timezone, timedelta
import random

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (
    Course,
    Enrollment,
    ExamSession,
    ExamSessionQuestion,
    Lesson,
    Module,
    Option,
    Question,
    QuestionPractice,
    Quiz,
    QuizAttempt,
)
from app.schemas.practice import (
    MockExamAnswerItem,
    MockExamCreatePayload,
    MockExamQuestionReview,
    MockExamQuestionTake,
    MockExamResultResponse,
    MockExamSessionResponse,
    MockExamSessionSummary,
    MockExamSubmitPayload,
    QuestionBankCheckRequest,
    QuestionBankCheckResponse,
    QuestionBankItemView,
    QuestionBankOptionView,
    QuestionBankStatsResponse,
    QuizHubItemResponse,
    QuizHubSummaryResponse,
)


# ==========================================
# QUIZ HUB SERVICE
# ==========================================

def get_quiz_hub_summary(db: Session, student_id: int) -> QuizHubSummaryResponse:
    """Fetch all 36 quizzes across published courses with authenticated student-specific attempt history in optimal queries."""
    # 1. Fetch all quizzes joined with lesson, module, and course
    quiz_rows = db.execute(
        select(Quiz, Lesson, Module, Course)
        .join(Lesson, Quiz.lesson_id == Lesson.id)
        .join(Module, Lesson.module_id == Module.id)
        .join(Course, Module.course_id == Course.id)
        .where(Course.published.is_(True))
        .order_by(Course.id, Module.order_number, Lesson.order_number)
    ).all()

    # 2. Pre-aggregate question count and total points per quiz in one query
    q_stats_rows = db.execute(
        select(
            Question.quiz_id,
            func.count(Question.id),
            func.coalesce(func.sum(Question.points), 0.0),
        )
        .group_by(Question.quiz_id)
    ).all()
    q_stats_map: dict[int, tuple[int, float]] = {
        row[0]: (int(row[1]), float(row[2])) for row in q_stats_rows
    }

    # 3. Get student enrollments
    enrolled_course_ids = set(
        db.scalars(
            select(Enrollment.course_id).where(Enrollment.student_id == student_id)
        ).all()
    )

    # 4. Get all quiz attempts by this student
    attempts = list(
        db.scalars(
            select(QuizAttempt)
            .where(QuizAttempt.student_id == student_id)
            .order_by(QuizAttempt.created_at.desc())
        ).all()
    )

    attempts_by_quiz: dict[int, list[QuizAttempt]] = {}
    for att in attempts:
        attempts_by_quiz.setdefault(att.quiz_id, []).append(att)

    hub_items: list[QuizHubItemResponse] = []
    completed_count = 0
    in_progress_count = 0
    not_attempted_count = 0
    passed_count = 0

    for quiz, lesson, module, course in quiz_rows:
        q_attempts = attempts_by_quiz.get(quiz.id, [])
        attempt_count = len(q_attempts)

        # Determine status and best score
        completed_attempts = [a for a in q_attempts if a.completed_at is not None]
        in_progress_attempts = [a for a in q_attempts if a.completed_at is None]

        best_score = max((a.score for a in completed_attempts), default=0.0)
        best_pct = max((a.percentage for a in completed_attempts), default=0.0)
        last_attempt_id = q_attempts[0].id if q_attempts else None

        if completed_attempts:
            quiz_status = "COMPLETED"
            completed_count += 1
        elif in_progress_attempts:
            quiz_status = "IN_PROGRESS"
            in_progress_count += 1
        else:
            quiz_status = "NOT_ATTEMPTED"
            not_attempted_count += 1

        passed = best_pct >= 60.0
        if passed:
            passed_count += 1

        q_count, total_points = q_stats_map.get(quiz.id, (0, 0.0))

        hub_items.append(
            QuizHubItemResponse(
                id=quiz.id,
                title=quiz.title,
                description=quiz.description,
                lesson_id=lesson.id,
                lesson_title=lesson.title,
                module_id=module.id,
                module_title=module.title,
                course_id=course.id,
                course_title=course.title,
                course_category=course.category,
                question_count=q_count,
                total_points=total_points,
                attempt_count=attempt_count,
                best_score=round(best_score, 2),
                best_percentage=round(best_pct, 2),
                last_attempt_id=last_attempt_id,
                status=quiz_status,
                passed=passed,
                is_enrolled=course.id in enrolled_course_ids,
            )
        )

    return QuizHubSummaryResponse(
        total_quizzes=len(hub_items),
        completed_quizzes=completed_count,
        in_progress_quizzes=in_progress_count,
        not_attempted_quizzes=not_attempted_count,
        passed_quizzes=passed_count,
        quizzes=hub_items,
    )


# ==========================================
# QUESTION BANK SERVICE
# ==========================================

def list_question_bank(
    db: Session,
    student_id: int,
    course_id: int | None = None,
    module_id: int | None = None,
    search: str | None = None,
    status_filter: str | None = "ALL",
) -> list[QuestionBankItemView]:
    """Retrieve real existing questions with options without revealing correct answers."""
    # Query questions from published courses
    query = (
        select(Question, Quiz, Lesson, Module, Course)
        .join(Quiz, Question.quiz_id == Quiz.id)
        .join(Lesson, Quiz.lesson_id == Lesson.id)
        .join(Module, Lesson.module_id == Module.id)
        .join(Course, Module.course_id == Course.id)
        .where(Course.published.is_(True))
    )

    if course_id:
        query = query.where(Course.id == course_id)
    if module_id:
        query = query.where(Module.id == module_id)
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.where(func.lower(Question.question_text).like(term))

    query = query.order_by(Course.id, Module.order_number, Lesson.order_number, Question.order_index)
    results = db.execute(query).all()

    # Query student's practice records for these questions
    practices = list(
        db.scalars(
            select(QuestionPractice).where(QuestionPractice.student_id == student_id)
        ).all()
    )
    practice_map = {p.question_id: p for p in practices}

    items: list[QuestionBankItemView] = []
    for q, quiz, lesson, module, course in results:
        p = practice_map.get(q.id)
        has_practiced = p is not None
        last_is_correct = p.is_correct if p else None
        last_selected_id = p.selected_option_id if p else None

        # Filter by practice status
        if status_filter == "ANSWERED" and not has_practiced:
            continue
        if status_filter == "UNANSWERED" and has_practiced:
            continue

        options_view = [
            QuestionBankOptionView(
                id=opt.id,
                option_text=opt.option_text,
                order_index=opt.order_index,
            )
            for opt in q.options
        ]

        items.append(
            QuestionBankItemView(
                id=q.id,
                quiz_id=quiz.id,
                question_text=q.question_text,
                question_type=q.question_type,
                points=q.points,
                order_index=q.order_index,
                course_id=course.id,
                course_title=course.title,
                module_id=module.id,
                module_title=module.title,
                lesson_id=lesson.id,
                lesson_title=lesson.title,
                options=options_view,
                has_practiced=has_practiced,
                last_is_correct=last_is_correct,
                last_selected_option_id=last_selected_id,
            )
        )

    return items


def check_question_answer(
    db: Session, student_id: int, payload: QuestionBankCheckRequest
) -> QuestionBankCheckResponse:
    """Verify answer for a single question practice attempt and record the result."""
    question = db.scalar(select(Question).where(Question.id == payload.question_id))
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    option = db.scalar(select(Option).where(Option.id == payload.selected_option_id))
    if not option or option.question_id != question.id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Option does not belong to this question",
        )

    correct_option = next((o for o in question.options if o.is_correct), None)
    if not correct_option:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Question has no configured correct answer",
        )

    is_correct = option.is_correct

    # Persist or update QuestionPractice record
    practice = db.scalar(
        select(QuestionPractice).where(
            QuestionPractice.student_id == student_id,
            QuestionPractice.question_id == question.id,
        )
    )

    if not practice:
        practice = QuestionPractice(
            student_id=student_id,
            question_id=question.id,
            selected_option_id=option.id,
            is_correct=is_correct,
        )
        db.add(practice)
    else:
        practice.selected_option_id = option.id
        practice.is_correct = is_correct
        practice.updated_at = datetime.now(timezone.utc)

    db.commit()

    explanation = (
        f"Correct! '{correct_option.option_text}' is the right answer."
        if is_correct
        else f"Incorrect. The correct answer is '{correct_option.option_text}'."
    )

    return QuestionBankCheckResponse(
        question_id=question.id,
        selected_option_id=option.id,
        is_correct=is_correct,
        correct_option_id=correct_option.id,
        explanation=explanation,
    )


def get_question_bank_stats(db: Session, student_id: int) -> QuestionBankStatsResponse:
    """Calculate practice metrics for authenticated student from real records."""
    practices = list(
        db.scalars(
            select(QuestionPractice).where(QuestionPractice.student_id == student_id)
        ).all()
    )

    total_practiced = len(practices)
    correct_count = sum(1 for p in practices if p.is_correct)
    incorrect_count = total_practiced - correct_count
    accuracy = round((correct_count * 100.0 / total_practiced), 1) if total_practiced > 0 else 0.0

    return QuestionBankStatsResponse(
        questions_practiced=total_practiced,
        correct=correct_count,
        incorrect=incorrect_count,
        accuracy_percentage=accuracy,
    )


# ==========================================
# MOCK EXAMS SERVICE
# ==========================================

def create_mock_exam(
    db: Session, student_id: int, payload: MockExamCreatePayload
) -> MockExamSessionResponse:
    """Securely configure and instantiate a mock exam session from real questions."""
    # 1. Query eligible questions from published courses
    query = (
        select(Question)
        .join(Quiz, Question.quiz_id == Quiz.id)
        .join(Lesson, Quiz.lesson_id == Lesson.id)
        .join(Module, Lesson.module_id == Module.id)
        .join(Course, Module.course_id == Course.id)
        .where(Course.published.is_(True))
    )

    course_title = "All Courses"
    course = None
    if payload.course_id is not None:
        course = db.scalar(select(Course).where(Course.id == payload.course_id))
        if not course or not course.published:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        query = query.where(Course.id == payload.course_id)
        course_title = course.title

    eligible_questions = list(db.scalars(query).all())
    eligible_count = len(eligible_questions)

    if eligible_count < payload.question_count:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {eligible_count} questions are available for {course_title}. Cannot start a {payload.question_count}-question exam.",
        )

    # 2. Randomly select the requested number of unique questions
    selected_questions = random.sample(eligible_questions, payload.question_count)

    # 3. Create ExamSession
    title = f"Mock Exam: {course_title}"
    total_pts = float(sum(q.points for q in selected_questions))

    session = ExamSession(
        student_id=student_id,
        title=title,
        course_id=course.id if course else None,
        question_count=payload.question_count,
        duration_minutes=payload.duration_minutes,
        started_at=datetime.now(timezone.utc),
        status="IN_PROGRESS",
        score=0.0,
        total_points=total_pts,
        percentage=0.0,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # 4. Persist selected questions to ExamSessionQuestion
    session_questions: list[ExamSessionQuestion] = []
    for idx, q in enumerate(selected_questions, 1):
        eq = ExamSessionQuestion(
            session_id=session.id,
            question_id=q.id,
            order_index=idx,
            selected_option_id=None,
            is_correct=False,
            points_earned=0.0,
        )
        db.add(eq)
        session_questions.append(eq)

    db.commit()

    # 5. Return questions WITHOUT revealing answers
    questions_take = [
        MockExamQuestionTake(
            id=q.id,
            order_index=idx,
            question_text=q.question_text,
            points=q.points,
            options=[
                QuestionBankOptionView(
                    id=opt.id,
                    option_text=opt.option_text,
                    order_index=opt.order_index,
                )
                for opt in q.options
            ],
            selected_option_id=None,
        )
        for idx, q in enumerate(selected_questions, 1)
    ]

    return MockExamSessionResponse(
        id=session.id,
        title=session.title,
        course_id=session.course_id,
        course_title=course_title if session.course_id else "All Courses",
        question_count=session.question_count,
        duration_minutes=session.duration_minutes,
        started_at=session.started_at,
        submitted_at=session.submitted_at,
        status=session.status,
        score=session.score,
        total_points=session.total_points,
        percentage=session.percentage,
        time_spent_seconds=0,
        questions=questions_take,
    )


def get_mock_exam_session(
    db: Session, student_id: int, session_id: int
) -> MockExamSessionResponse:
    """Retrieve an existing exam session. If in progress, return questions without answers."""
    session = db.scalar(
        select(ExamSession).where(
            ExamSession.id == session_id, ExamSession.student_id == student_id
        )
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Mock exam session not found"
        )

    # Calculate time elapsed
    now = datetime.now(timezone.utc)
    started = session.started_at
    if started.tzinfo is None:
        started = started.replace(tzinfo=timezone.utc)

    elapsed_seconds = int((now - started).total_seconds())

    # Build question views
    questions_take: list[MockExamQuestionTake] = []
    for eq in session.session_questions:
        q = eq.question
        questions_take.append(
            MockExamQuestionTake(
                id=q.id,
                order_index=eq.order_index,
                question_text=q.question_text,
                points=q.points,
                options=[
                    QuestionBankOptionView(
                        id=opt.id,
                        option_text=opt.option_text,
                        order_index=opt.order_index,
                    )
                    for opt in q.options
                ],
                selected_option_id=eq.selected_option_id,
            )
        )

    course_title = session.course.title if session.course else "All Courses"

    return MockExamSessionResponse(
        id=session.id,
        title=session.title,
        course_id=session.course_id,
        course_title=course_title,
        question_count=session.question_count,
        duration_minutes=session.duration_minutes,
        started_at=session.started_at,
        submitted_at=session.submitted_at,
        status=session.status,
        score=session.score,
        total_points=session.total_points,
        percentage=session.percentage,
        time_spent_seconds=elapsed_seconds,
        questions=questions_take,
    )


def submit_mock_exam(
    db: Session, student_id: int, session_id: int, payload: MockExamSubmitPayload
) -> MockExamResultResponse:
    """Score submitted answers server-side, persist results, and lock session."""
    session = db.scalar(
        select(ExamSession).where(
            ExamSession.id == session_id, ExamSession.student_id == student_id
        )
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Mock exam session not found"
        )

    if session.status == "SUBMITTED":
        # Return existing result rather than failing
        return get_mock_exam_result(db, student_id, session_id)

    submitted_answers_map = {a.question_id: a.selected_option_id for a in payload.answers}

    now = datetime.now(timezone.utc)
    started = session.started_at
    if started.tzinfo is None:
        started = started.replace(tzinfo=timezone.utc)
    time_spent = max(1, int((now - started).total_seconds()))

    total_score = 0.0
    correct_count = 0
    incorrect_count = 0
    unanswered_count = 0

    for eq in session.session_questions:
        q = eq.question
        selected_id = submitted_answers_map.get(q.id)

        if selected_id is None:
            unanswered_count += 1
            eq.selected_option_id = None
            eq.is_correct = False
            eq.points_earned = 0.0
        else:
            option = next((o for o in q.options if o.id == selected_id), None)
            if option and option.is_correct:
                eq.selected_option_id = selected_id
                eq.is_correct = True
                eq.points_earned = float(q.points)
                total_score += float(q.points)
                correct_count += 1
            else:
                eq.selected_option_id = selected_id
                eq.is_correct = False
                eq.points_earned = 0.0
                incorrect_count += 1

    total_possible = session.total_points if session.total_points > 0 else float(session.question_count)
    percentage = round((total_score * 100.0 / total_possible), 2) if total_possible > 0 else 0.0

    session.score = round(total_score, 2)
    session.percentage = percentage
    session.submitted_at = now
    session.status = "SUBMITTED"

    db.commit()
    db.refresh(session)

    return get_mock_exam_result(db, student_id, session_id)


def get_mock_exam_result(
    db: Session, student_id: int, session_id: int
) -> MockExamResultResponse:
    """Retrieve full exam results and answer key for post-submission review."""
    session = db.scalar(
        select(ExamSession).where(
            ExamSession.id == session_id, ExamSession.student_id == student_id
        )
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Mock exam session not found"
        )

    started = session.started_at
    if started.tzinfo is None:
        started = started.replace(tzinfo=timezone.utc)
    submitted = session.submitted_at or datetime.now(timezone.utc)
    if submitted.tzinfo is None:
        submitted = submitted.replace(tzinfo=timezone.utc)

    time_spent = max(1, int((submitted - started).total_seconds()))

    reviews: list[MockExamQuestionReview] = []
    correct_count = 0
    incorrect_count = 0
    unanswered_count = 0

    for eq in session.session_questions:
        q = eq.question
        correct_opt = next((o for o in q.options if o.is_correct), None)
        selected_opt = next((o for o in q.options if o.id == eq.selected_option_id), None)

        if eq.selected_option_id is None:
            unanswered_count += 1
        elif eq.is_correct:
            correct_count += 1
        else:
            incorrect_count += 1

        reviews.append(
            MockExamQuestionReview(
                question_id=q.id,
                question_text=q.question_text,
                points=q.points,
                selected_option_id=eq.selected_option_id,
                selected_option_text=selected_opt.option_text if selected_opt else None,
                correct_option_id=correct_opt.id if correct_opt else 0,
                correct_option_text=correct_opt.option_text if correct_opt else "",
                is_correct=eq.is_correct,
                points_earned=eq.points_earned,
                options=[
                    QuestionBankOptionView(
                        id=opt.id,
                        option_text=opt.option_text,
                        order_index=opt.order_index,
                    )
                    for opt in q.options
                ],
            )
        )

    course_title = session.course.title if session.course else "All Courses"
    passed = session.percentage >= 60.0

    return MockExamResultResponse(
        id=session.id,
        title=session.title,
        course_title=course_title,
        question_count=session.question_count,
        duration_minutes=session.duration_minutes,
        started_at=session.started_at,
        submitted_at=session.submitted_at,
        status=session.status,
        score=session.score,
        total_points=session.total_points,
        percentage=session.percentage,
        correct_count=correct_count,
        incorrect_count=incorrect_count,
        unanswered_count=unanswered_count,
        time_spent_seconds=time_spent,
        passed=passed,
        reviews=reviews,
    )


def list_mock_exam_sessions(
    db: Session, student_id: int
) -> list[MockExamSessionSummary]:
    """List authenticated student's previous mock exam attempts."""
    sessions = list(
        db.scalars(
            select(ExamSession)
            .where(ExamSession.student_id == student_id)
            .order_by(ExamSession.created_at.desc())
        ).all()
    )

    return [
        MockExamSessionSummary(
            id=s.id,
            title=s.title,
            course_id=s.course_id,
            course_title=s.course.title if s.course else "All Courses",
            question_count=s.question_count,
            duration_minutes=s.duration_minutes,
            started_at=s.started_at,
            submitted_at=s.submitted_at,
            status=s.status,
            score=s.score,
            total_points=s.total_points,
            percentage=s.percentage,
            passed=s.percentage >= 60.0,
        )
        for s in sessions
    ]
