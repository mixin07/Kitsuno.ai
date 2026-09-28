from __future__ import annotations

from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class GameListItem(BaseModel):
    id: str
    title: str
    subtitle: str
    description: str
    icon: str
    color: str
    badge: str
    estimated_time: str
    xp_reward: int
    high_score: int = 0
    total_played: int = 0


class GameStartRequest(BaseModel):
    course_id: int | None = None
    lesson_id: int | None = None


class GameDetailResponse(BaseModel):
    id: str
    title: str
    subtitle: str
    description: str
    instructions: list[str]
    xp_reward: int
    session_token: str
    course_id: int | None = None
    course_title: str | None = None
    content: dict[str, Any]


class GameCompleteRequest(BaseModel):
    session_token: str
    score: int = Field(default=0, ge=0)
    time_spent_seconds: int = Field(default=0, ge=0)
    course_id: int | None = None
    lesson_id: int | None = None
    answers: list[dict[str, Any]] | None = None
    matched_pairs: list[str] | None = None
    scrambled_answers: list[dict[str, str]] | None = None
    challenge_solutions: list[dict[str, Any]] | None = None


class GameCompleteResponse(BaseModel):
    success: bool
    game_id: str
    score: int
    accuracy: float = 0.0
    questions_count: int = 0
    correct_count: int = 0
    time_spent_seconds: int
    xp_awarded: int
    total_xp: int
    current_level: int
    is_new_high_score: bool
    high_score: int
    unlocked_achievements: list[str] = Field(default_factory=list)


class GameStatsResponse(BaseModel):
    games_played: int
    best_score: int
    total_game_xp: int
    plays_by_game: dict[str, int]


class GameHistoryItem(BaseModel):
    id: int
    game_id: str
    game_title: str
    course_id: int | None = None
    course_title: str | None = None
    score: int
    accuracy: float
    time_spent_seconds: int
    xp_awarded: int
    created_at: datetime
