from __future__ import annotations

import enum
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.course import Course
    from app.models.lesson import Lesson
    from app.models.module import Module
    from app.models.quiz import Quiz
    from app.models.user import User


class PlanStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"


class TaskType(str, enum.Enum):
    LESSON = "LESSON"
    QUIZ = "QUIZ"
    REVIEW = "REVIEW"


class TaskPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class TaskStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    SKIPPED = "SKIPPED"


class StudyPlan(Base):
    __tablename__ = "study_plans"
    __table_args__ = (
        Index("ix_study_plans_student_id", "student_id"),
        Index("ix_study_plans_course_id", "course_id"),
        Index("ix_study_plans_status", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_date: Mapped[date] = mapped_column(Date, nullable=False)
    daily_minutes_goal: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    preferred_days: Mapped[list[int] | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[PlanStatus] = mapped_column(
        Enum(PlanStatus), default=PlanStatus.ACTIVE, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    student: Mapped[User] = relationship(back_populates="study_plans")
    course: Mapped[Course] = relationship()
    tasks: Mapped[list[StudyPlanTask]] = relationship(
        back_populates="study_plan",
        cascade="all, delete-orphan",
        order_by="StudyPlanTask.scheduled_date, StudyPlanTask.sort_order",
    )


class StudyPlanTask(Base):
    __tablename__ = "study_plan_tasks"
    __table_args__ = (
        Index("ix_study_plan_tasks_plan_id", "study_plan_id"),
        Index("ix_study_plan_tasks_student_id", "student_id"),
        Index("ix_study_plan_tasks_scheduled_date", "scheduled_date"),
        Index("ix_study_plan_tasks_status", "status"),
        Index("ix_study_plan_tasks_student_lesson", "student_id", "lesson_id"),
        Index("ix_study_plan_tasks_student_date", "student_id", "scheduled_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    study_plan_id: Mapped[int] = mapped_column(
        ForeignKey("study_plans.id", ondelete="CASCADE"), nullable=False
    )
    student_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    module_id: Mapped[int | None] = mapped_column(
        ForeignKey("modules.id", ondelete="SET NULL"), nullable=True, index=True
    )
    lesson_id: Mapped[int | None] = mapped_column(
        ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True, index=True
    )
    quiz_id: Mapped[int | None] = mapped_column(
        ForeignKey("quizzes.id", ondelete="SET NULL"), nullable=True, index=True
    )
    task_type: Mapped[TaskType] = mapped_column(
        Enum(TaskType), default=TaskType.LESSON, nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    scheduled_date: Mapped[date] = mapped_column(Date, nullable=False)
    estimated_minutes: Mapped[int] = mapped_column(Integer, default=20, nullable=False)
    priority: Mapped[TaskPriority] = mapped_column(
        Enum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False
    )
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus), default=TaskStatus.PENDING, nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    study_plan: Mapped[StudyPlan] = relationship(back_populates="tasks")
    student: Mapped[User] = relationship()
    course: Mapped[Course] = relationship()
    module: Mapped[Module | None] = relationship()
    lesson: Mapped[Lesson | None] = relationship()
    quiz: Mapped[Quiz | None] = relationship()
