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


class StreakActivityItem(BaseModel):
    id: str
    activity_type: str  # "LESSON" | "QUIZ" | "GAME"
    title: str
    course_title: str | None = None
    completed_at: datetime
    xp_earned: int

    model_config = ConfigDict(from_attributes=True)


class StreakDetailsResponse(BaseModel):
    current_streak: int
    longest_streak: int
    last_activity_date: date | None
    is_active_today: bool
    today_status_message: str
    active_dates_past_14: list[date]
    contributing_lessons_count: int
    contributing_quizzes_count: int
    recent_activities: list[StreakActivityItem]

    model_config = ConfigDict(from_attributes=True)


class XpSummaryResponse(BaseModel):
    total_xp: int
    current_level: int
    xp_earned_today: int
    xp_earned_this_week: int
    xp_into_level: int
    xp_required_for_next_level: int
    xp_remaining_to_next_level: int
    progress_percentage: float
    recent_history: list[GamificationActivityLogResponse]

    model_config = ConfigDict(from_attributes=True)


class LevelTierItem(BaseModel):
    level: int
    title: str
    xp_threshold: int
    is_unlocked: bool
    is_current: bool

    model_config = ConfigDict(from_attributes=True)


class LevelDetailsResponse(BaseModel):
    current_level: int
    total_xp: int
    xp_into_level: int
    xp_required_for_next_level: int
    xp_remaining_to_next_level: int
    progress_percentage: float
    next_level: int
    levels_timeline: list[LevelTierItem]

    model_config = ConfigDict(from_attributes=True)


class DayActivityEvent(BaseModel):
    id: str
    activity_type: str  # "LESSON", "QUIZ", "GAME", "XP"
    title: str
    course_title: str | None = None
    xp_earned: int = 0
    completed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class DayActivitySummary(BaseModel):
    date: date
    activity_count: int = 0
    xp_earned: int = 0
    lessons_completed: int = 0
    quizzes_completed: int = 0
    games_completed: int = 0
    events: list[DayActivityEvent] = []

    model_config = ConfigDict(from_attributes=True)


class MonthlyActivityResponse(BaseModel):
    year: int
    month: int
    active_dates: list[date]
    days: dict[str, DayActivitySummary]

    model_config = ConfigDict(from_attributes=True)

