from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.course import CourseDifficulty


class CourseCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    thumbnail_url: str | None = Field(default=None, max_length=500)
    category: str | None = Field(default=None, max_length=100)
    difficulty: CourseDifficulty = CourseDifficulty.BEGINNER


class CourseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    thumbnail_url: str | None = Field(default=None, max_length=500)
    category: str | None = Field(default=None, max_length=100)
    difficulty: CourseDifficulty | None = None


class CourseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    thumbnail_url: str | None
    category: str | None
    difficulty: CourseDifficulty
    instructor_id: int
    published: bool
    created_at: datetime
    updated_at: datetime


class ModuleCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    order_number: int | None = Field(default=None, ge=1)


class ModuleUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    order_number: int | None = Field(default=None, ge=1)


class ModuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    title: str
    description: str | None
    order_number: int
    created_at: datetime
    updated_at: datetime


class LessonCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    content: str | None = Field(default=None, max_length=100000)
    video_url: str | None = Field(default=None, max_length=500)
    resource_url: str | None = Field(default=None, max_length=500)
    duration_minutes: int | None = Field(default=None, ge=0)
    order_number: int | None = Field(default=None, ge=1)


class LessonUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    content: str | None = Field(default=None, max_length=100000)
    video_url: str | None = Field(default=None, max_length=500)
    resource_url: str | None = Field(default=None, max_length=500)
    duration_minutes: int | None = Field(default=None, ge=0)
    order_number: int | None = Field(default=None, ge=1)


class LessonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    module_id: int
    title: str
    description: str | None
    content: str | None
    video_url: str | None
    resource_url: str | None
    duration_minutes: int | None
    order_number: int
    quiz_id: int | None = None
    created_at: datetime
    updated_at: datetime