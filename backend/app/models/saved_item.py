from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.course import Course
    from app.models.lesson import Lesson
    from app.models.user import User


class SavedCourse(Base):
    __tablename__ = "saved_courses"
    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="uq_saved_course_user_course"),
        Index("ix_saved_courses_user_id", "user_id"),
        Index("ix_saved_courses_course_id", "course_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped[User] = relationship("User")
    course: Mapped[Course] = relationship("Course")


class SavedLesson(Base):
    __tablename__ = "saved_lessons"
    __table_args__ = (
        UniqueConstraint("user_id", "lesson_id", name="uq_saved_lesson_user_lesson"),
        Index("ix_saved_lessons_user_id", "user_id"),
        Index("ix_saved_lessons_lesson_id", "lesson_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    lesson_id: Mapped[int] = mapped_column(
        ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped[User] = relationship("User")
    lesson: Mapped[Lesson] = relationship("Lesson")


class SavedNote(Base):
    __tablename__ = "saved_notes"
    __table_args__ = (
        UniqueConstraint("user_id", "lesson_id", name="uq_saved_note_user_lesson"),
        Index("ix_saved_notes_user_id", "user_id"),
        Index("ix_saved_notes_lesson_id", "lesson_id"),
        Index("ix_saved_notes_course_id", "course_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    lesson_id: Mapped[int] = mapped_column(
        ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False
    )
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    content_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user: Mapped[User] = relationship("User")
    lesson: Mapped[Lesson] = relationship("Lesson")
    course: Mapped[Course] = relationship("Course")


class UserCourseStatus(Base):
    __tablename__ = "user_course_statuses"
    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="uq_user_course_status"),
        Index("ix_user_course_statuses_user_id", "user_id"),
        Index("ix_user_course_statuses_course_id", "course_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="IN_PROGRESS"
    )  # WANT_TO_STUDY, PLANNING, IN_PROGRESS, COMPLETED
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user: Mapped[User] = relationship("User")
    course: Mapped[Course] = relationship("Course")
