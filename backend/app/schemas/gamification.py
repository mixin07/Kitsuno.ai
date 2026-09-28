from datetime import date, datetime
from pydantic import BaseModel, ConfigDict


class LevelProgressInfo(BaseModel):
    current_level: int
    total_xp: int
    xp_into_level: int
    xp_required_for_next_level: int
    progress_percentage: float

    model_config = ConfigDict(from_attributes=True)


class StreakInfo(BaseModel):
    current_streak: int
    longest_streak: int
    last_activity_date: date | None

    model_config = ConfigDict(from_attributes=True)


class QuestItemResponse(BaseModel):
    id: str
    title: str
    period: str  # 'daily' | 'weekly'
    current_count: int
    target_count: int
    xp_reward: int
    completed: bool

    model_config = ConfigDict(from_attributes=True)


class AchievementItemResponse(BaseModel):
    id: str
    title: str
    description: str
    unlocked: bool
    unlocked_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class GamificationActivityLogResponse(BaseModel):
    id: int
    event_type: str
    xp_earned: int
    description: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StudentGamificationResponse(BaseModel):
    total_xp: int
    level_info: LevelProgressInfo
    streak_info: StreakInfo
    quests: list[QuestItemResponse]
    achievements: list[AchievementItemResponse]
    recent_logs: list[GamificationActivityLogResponse]

    model_config = ConfigDict(from_attributes=True)
