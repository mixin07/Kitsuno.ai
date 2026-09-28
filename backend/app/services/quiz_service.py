from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import AttemptAnswer, Course, Lesson, Module, Option, Question, Quiz, QuizAttempt
from app.schemas.quiz import (
    AttemptAnswerView,
    AttemptDetailResponse,
    AttemptSubmitPayload,
    OptionTake,
    QuestionTake,
    QuizTakeResponse,
)
from app.services import enrollment_service


def _require_quiz_in_published_course(db: Session, quiz_id: int) -> tuple[Quiz, Course]:
    row = db.execute(
        select(Quiz, Course)
        .join(Lesson, Quiz.lesson_id == Lesson.id)
        .join(Module, Lesson.module_id == Module.id)
        .join(Course, Module.course_id == Course.id)
        .where(Quiz.id == quiz_id)
    ).first()
    if row is None or not row[1].published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    return row[0], row[1]


def _require_enrolled_student(db: Session, student_id: int, course: Course) -> None:
    enrollment_service.require_enrollment(db, student_id, course.id)


def get_quiz_for_take(db: Session, student_id: int, quiz_id: int) -> QuizTakeResponse:
    quiz, course = _require_quiz_in_published_course(db, quiz_id)
    _require_enrolled_student(db, student_id, course)
    questions = [
        QuestionTake(
            id=q.id,
            quiz_id=q.quiz_id,
            question_text=q.question_text,
            question_type=q.question_type,
            points=q.points,
            order_index=q.order_index,
            options=[
                OptionTake(
                    id=o.id,
                    question_id=o.question_id,
                    option_text=o.option_text,
                    order_index=o.order_index,
                )
                for o in q.options
            ],
        )
        for q in quiz.questions
    ]
    return QuizTakeResponse(
        id=quiz.id,
        lesson_id=quiz.lesson_id,
        title=quiz.title,
        description=quiz.description,
        questions=questions,
        total_points=sum(q.points for q in quiz.questions),
    )


def start_attempt(db: Session, student_id: int, quiz_id: int) -> QuizAttempt:
    quiz, course = _require_quiz_in_published_course(db, quiz_id)
    _require_enrolled_student(db, student_id, course)
    total_points = float(sum(q.points for q in quiz.questions))
    attempt = QuizAttempt(
        quiz_id=quiz.id,
        student_id=student_id,
        score=0.0,
        total_points=total_points,
        percentage=0.0,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt


def list_attempts(db: Session, student_id: int, quiz_id: int) -> list[QuizAttempt]:
    quiz, course = _require_quiz_in_published_course(db, quiz_id)
    _require_enrolled_student(db, student_id, course)
    return list(
        db.scalars(
            select(QuizAttempt)
            .where(QuizAttempt.quiz_id == quiz.id, QuizAttempt.student_id == student_id)
            .order_by(QuizAttempt.created_at.desc())
        )
    )


def get_attempt(db: Session, student_id: int, attempt_id: int) -> QuizAttempt:
    attempt = db.scalar(select(QuizAttempt).where(QuizAttempt.id == attempt_id))
    if attempt is None or attempt.student_id != student_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")
    return attempt


def submit_attempt(
    db: Session, student_id: int, attempt_id: int, payload: AttemptSubmitPayload
) -> QuizAttempt:
    attempt = get_attempt(db, student_id, attempt_id)
    if attempt.completed_at is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Attempt already submitted"
        )

    questions = list(attempt.quiz.questions)
    question_map = {q.id: q for q in questions}

    for answer in payload.answers:
        question = question_map.get(answer.question_id)
        if question is None:
            raise HTTPException(
                status_code=422,
                detail=f"Question {answer.question_id} is not part of this quiz",
            )
        if answer.selected_option_id is not None:
            option = db.scalar(
                select(Option).where(Option.id == answer.selected_option_id)
            )
            if option is None or option.question_id != question.id:
                raise HTTPException(
                    status_code=422,
                    detail=f"Option {answer.selected_option_id} is not valid for question {question.id}",
                )

    answers_by_question = {a.question_id: a for a in payload.answers}
    score = 0.0
    total = 0.0
    for question in questions:
        total += float(question.points)
        submitted = answers_by_question.get(question.id)
        selected_option_id = submitted.selected_option_id if submitted is not None else None
        points_earned = 0.0
        is_correct = False
        if selected_option_id is not None:
            option = next(o for o in question.options if o.id == selected_option_id)
            is_correct = option.is_correct
            points_earned = float(question.points) if option.is_correct else 0.0
        db.add(
            AttemptAnswer(
                attempt_id=attempt.id,
                question_id=question.id,
                selected_option_id=selected_option_id,
                is_correct=is_correct,
                points_earned=points_earned,
            )
        )
        score += points_earned

    attempt.score = round(score, 2)
    attempt.total_points = round(total, 2)
    attempt.percentage = round(score * 100 / total, 2) if total > 0 else 0.0
    attempt.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(attempt)

    # Progress integration: passing quiz marks corresponding lesson completed
    if attempt.percentage >= 60.0 and attempt.quiz is not None:
        try:
            from app.services import progress_service
            from app.schemas.learning import LessonProgressUpdate
            progress_service.update_lesson_progress(
                db, student_id, attempt.quiz.lesson_id, LessonProgressUpdate(completed=True)
            )
            db.commit()
        except Exception:
            pass

    from app.services import gamification_service
    gamification_service.on_quiz_completed(db, student_id, attempt)

    return attempt


def build_attempt_detail(attempt: QuizAttempt) -> AttemptDetailResponse:
    answers = []
    for answer in attempt.answers:
        correct_opt = next((o for o in answer.question.options if o.is_correct), None)
        answers.append(
            AttemptAnswerView(
                id=answer.id,
                question_id=answer.question_id,
                question_text=answer.question.question_text,
                selected_option_id=answer.selected_option_id,
                selected_option_text=answer.option.option_text if answer.option is not None else None,
                correct_option_text=correct_opt.option_text if correct_opt is not None else None,
                is_correct=answer.is_correct,
                points_earned=answer.points_earned,
            )
        )
    return AttemptDetailResponse(
        id=attempt.id,
        quiz_id=attempt.quiz_id,
        student_id=attempt.student_id,
        score=attempt.score,
        total_points=attempt.total_points,
        percentage=attempt.percentage,
        completed_at=attempt.completed_at,
        created_at=attempt.created_at,
        answers=answers,
        quiz_title=attempt.quiz.title if attempt.quiz is not None else None,
        lesson_id=attempt.quiz.lesson_id if attempt.quiz is not None else None,
    )
