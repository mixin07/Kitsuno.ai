from pydantic import BaseModel, ConfigDict


class StudentRecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: str  # "in_progress" | "completed" | "no_enrollment"
    course_id: int | None = None
    course_title: str | None = None
    category: str | None = None
    module_id: int | None = None
    module_title: str | None = None
    lesson_id: int | None = None
    lesson_title: str | None = None
    duration_minutes: int | None = None
    completed_lessons: int = 0
    total_lessons: int = 0
    progress_percentage: int = 0
    explanation: str | None = None
