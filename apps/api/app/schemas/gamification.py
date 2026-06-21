from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class BadgeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    name: str
    description: str
    icon: str
    threshold_type: str
    threshold_value: int


class EarnedBadgeOut(BadgeOut):
    earned_at: datetime


class GamificationOut(BaseModel):
    xp: int
    level: int
    xp_into_level: int
    xp_for_next_level: int
    streak_days: int
    longest_streak: int
    last_active_date: date | None
    badges: list[EarnedBadgeOut]


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    display_name: str
    xp: int
    level: int
    streak_days: int
    is_me: bool = False


class LeaderboardOut(BaseModel):
    entries: list[LeaderboardEntry]
    my_rank: int | None = None
