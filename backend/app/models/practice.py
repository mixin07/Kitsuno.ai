from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.course import Course
    from app.models.option import Option
    from app.models.question import Question
    from app.models.user import User


class QuestionPractice(Base):
    __tablename__ = "question_practices"
    __table_args__ = (
        Index("ix_question_practices_student_id", "student_id"),
        Index("ix_question_practices_question_id", "question_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"), nullable=False
    )
    selected_option_id: Mapped[int | None] = mapped_column(
        ForeignKey("options.id", ondelete="CASCADE"), nullable=True
    )
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    student: Mapped[User] = relationship()
    question: Mapped[Question] = relationship()
    selected_option: Mapped[Option | None] = relationship()


class ExamSession(Base):
    __tablename__ = "exam_sessions"
    __table_args__ = (
        Index("ix_exam_sessions_student_id", "student_id"),
        Index("ix_exam_sessions_course_id", "course_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    course_id: Mapped[int | None] = mapped_column(
        ForeignKey("courses.id", ondelete="SET NULL"), nullable=True
    )
    question_count: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(50), default="IN_PROGRESS", nullable=False
    )  # IN_PROGRESS, SUBMITTED, EXPIRED
    score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_points: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    percentage: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    student: Mapped[User] = relationship()
    course: Mapped[Course | None] = relationship()
    session_questions: Mapped[list[ExamSessionQuestion]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ExamSessionQuestion.order_index",
    )


class ExamSessionQuestion(Base):
    __tablename__ = "exam_session_questions"
    __table_args__ = (
        Index("ix_exam_session_questions_session_id", "session_id"),
        Index("ix_exam_session_questions_question_id", "question_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("exam_sessions.id", ondelete="CASCADE"), nullable=False
    )
    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"), nullable=False
    )
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    selected_option_id: Mapped[int | None] = mapped_column(
        ForeignKey("options.id", ondelete="SET NULL"), nullable=True
    )
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    points_earned: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    session: Mapped[ExamSession] = relationship(back_populates="session_questions")
    question: Mapped[Question] = relationship()
    selected_option: Mapped[Option | None] = relationship()
