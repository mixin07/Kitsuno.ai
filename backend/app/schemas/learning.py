from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.course import CourseResponse, LessonResponse


class EnrollmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    course_id: int
    progress: int
    enrolled_at: datetime
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class EnrollmentDetailResponse(EnrollmentResponse):
    total_lessons: int
    completed_lessons: int
    next_lesson: LessonResponse | None
    course: CourseResponse


class CourseProgressResponse(BaseModel):
    course_id: int
    total_lessons: int
    completed_lessons: int
    progress: int
    completed: bool
    next_lesson: LessonResponse | None
    completed_lesson_ids: list[int] = Field(default_factory=list)


class LessonProgressUpdate(BaseModel):
    watch_time: float | None = Field(default=None, ge=0)
    last_position: float | None = Field(default=None, ge=0)
    completed: bool | None = None


class LessonProgressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int | None
    student_id: int
    lesson_id: int
    completed: bool
    watch_time: float
    last_position: float
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime | None
    updated_at: datetime | None