from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.course import CourseResponse


class SavedCourseItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    created_at: datetime
    course: CourseResponse


class SavedLessonItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lesson_id: int
    course_id: int
    lesson_title: str
    course_title: str
    duration_minutes: int | None = None
    created_at: datetime


class SavedNoteCreateRequest(BaseModel):
    lesson_id: int
    course_id: int
    topic: str = Field(min_length=1, max_length=255)
    content: Any  # Can be dict or JSON string


class SavedNoteItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lesson_id: int
    course_id: int
    topic: str
    content: Any  # parsed dict or raw string
    lesson_title: str
    course_title: str
    created_at: datetime
    updated_at: datetime


class CourseStatusUpdateRequest(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        clean = str(v).strip().upper()
        if clean not in {"WANT_TO_STUDY", "PLANNING", "IN_PROGRESS", "COMPLETED"}:
            raise ValueError(f"Invalid status: {v}. Must be one of WANT_TO_STUDY, PLANNING, IN_PROGRESS, COMPLETED")
        return clean


class CourseStatusItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    course_id: int
    status: str
    updated_at: datetime


class SavedOverviewResponse(BaseModel):
    saved_course_ids: list[int]
    saved_lesson_ids: list[int]
    saved_note_lesson_ids: list[int]
    course_statuses: dict[int, str]
