from __future__ import annotations

from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.study_plan import PlanStatus, TaskPriority, TaskStatus, TaskType


class StudyPlanCreate(BaseModel):
    course_id: int
    title: str | None = None
    description: str | None = None
    target_date: date
    daily_minutes_goal: int = Field(default=30, ge=10, le=480)
    preferred_days: list[int] | None = None  # 0=Monday, 6=Sunday
    include_quizzes: bool = True


class StudyPlanUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    target_date: date | None = None
    daily_minutes_goal: int | None = Field(default=None, ge=10, le=480)
    preferred_days: list[int] | None = None
    status: PlanStatus | None = None


class StudyPlanRescheduleRequest(BaseModel):
    new_target_date: date | None = None
    daily_minutes_goal: int | None = Field(default=None, ge=10, le=480)
    preferred_days: list[int] | None = None
    reschedule_mode: str = "ALL_UNFINISHED"  # "ALL_UNFINISHED" or "OVERDUE_ONLY"


class StudyPlanTaskCreate(BaseModel):
    title: str
    description: str | None = None
    scheduled_date: date
    estimated_minutes: int = Field(default=20, ge=5, le=360)
    priority: TaskPriority = TaskPriority.MEDIUM
    task_type: TaskType = TaskType.LESSON
    module_id: int | None = None
    lesson_id: int | None = None
    quiz_id: int | None = None


class StudyPlanTaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    scheduled_date: date | None = None
    estimated_minutes: int | None = Field(default=None, ge=5, le=360)
    priority: TaskPriority | None = None
    status: TaskStatus | None = None
    sort_order: int | None = None


class StudyPlanTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    study_plan_id: int
    student_id: int
    course_id: int
    course_title: str | None = None
    module_id: int | None = None
    module_title: str | None = None
    lesson_id: int | None = None
    lesson_title: str | None = None
    quiz_id: int | None = None
    quiz_title: str | None = None
    task_type: TaskType
    title: str
    description: str | None = None
    scheduled_date: date
    estimated_minutes: int
    priority: TaskPriority
    status: TaskStatus
    completed_at: datetime | None = None
    is_overdue: bool = False
    sort_order: int
    created_at: datetime
    updated_at: datetime


class StudyPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    course_id: int
    course_title: str
    course_thumbnail_url: str | None = None
    title: str
    description: str | None = None
    target_date: date
    daily_minutes_goal: int
    preferred_days: list[int] | None = None
    status: PlanStatus
    total_tasks: int = 0
    completed_tasks: int = 0
    overdue_tasks: int = 0
    pending_tasks: int = 0
    progress_percentage: int = 0
    course_progress_percentage: int = 0
    health_status: str = "ON_TRACK"  # "ON_TRACK", "AHEAD", "AT_RISK", "COMPLETED"
    health_message: str = "You are on track to finish by your target date."
    days_remaining: int = 0
    estimated_total_minutes_remaining: int = 0
    created_at: datetime
    updated_at: datetime


class StudyPlanDetailResponse(StudyPlanResponse):
    tasks: list[StudyPlanTaskResponse] = []


class TodayPlanResponse(BaseModel):
    date: date
    tasks: list[StudyPlanTaskResponse] = []
    total_tasks: int = 0
    completed_tasks: int = 0
    total_estimated_minutes: int = 0
    completed_minutes: int = 0
    daily_minutes_goal: int = 30
    progress_percentage: int = 0
    overdue_tasks_count: int = 0
    overdue_tasks: list[StudyPlanTaskResponse] = []


class WeeklyDayPlan(BaseModel):
    date: date
    day_name: str
    tasks: list[StudyPlanTaskResponse] = []
    total_minutes: int = 0
    completed_minutes: int = 0
    is_today: bool = False


class WeeklyPlanResponse(BaseModel):
    week_start: date
    week_end: date
    days: list[WeeklyDayPlan] = []
    total_tasks_this_week: int = 0
    completed_tasks_this_week: int = 0
