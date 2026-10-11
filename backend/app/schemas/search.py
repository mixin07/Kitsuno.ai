from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class SearchResultItem(BaseModel):
    id: str
    title: str
    content_type: str  # "COURSE" | "MODULE" | "LESSON" | "QUIZ"
    course_id: int
    course_title: str
    module_id: int | None = None
    module_title: str | None = None
    lesson_id: int | None = None
    lesson_title: str | None = None
    quiz_id: int | None = None
    description: str
    action_label: str  # "View Course" | "Open Module" | "Open Lesson" | "Open Quiz"
    action_url: str
    relevance_score: float = 0.0
    category: str | None = None

    model_config = ConfigDict(from_attributes=True)


class SearchResponse(BaseModel):
    query: str
    interpreted_query: str | None = None
    total_results: int
    results: list[SearchResultItem]
