from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_current_user_optional
from app.db.session import get_db
from app.models.user import User
from app.schemas.gamification import (
    EarnedBadgeOut,
    GamificationOut,
    LeaderboardEntry,
    LeaderboardOut,
)
from app.services import gamification as gam

router = APIRouter(tags=["gamification"])


@router.get("/me/gamification", response_model=GamificationOut)
def my_gamification(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> GamificationOut:
    stats, earned = gam.get_gamification(db, user)
    badges = [
        EarnedBadgeOut(
            code=ub.badge.code,
            name=ub.badge.name,
            description=ub.badge.description,
            icon=ub.badge.icon,
            threshold_type=ub.badge.threshold_type,
            threshold_value=ub.badge.threshold_value,
            earned_at=ub.created_at,
        )
        for ub in earned
    ]
    current_floor = gam.xp_for_level(stats.level)
    next_floor = gam.xp_for_level(stats.level + 1)
    return GamificationOut(
        xp=stats.xp,
        level=stats.level,
        xp_into_level=stats.xp - current_floor,
        xp_for_next_level=next_floor - current_floor,
        streak_days=stats.streak_days,
        longest_streak=stats.longest_streak,
        last_active_date=stats.last_active_date,
        badges=badges,
    )


@router.get("/leaderboard", response_model=LeaderboardOut)
def get_leaderboard(
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
) -> LeaderboardOut:
    ranked, my_rank = gam.leaderboard(db, user)
    entries = [
        LeaderboardEntry(
            rank=rank,
            user_id=u.id,
            display_name=u.display_name or (u.email.split("@")[0] if u.email else "Learner"),
            xp=s.xp,
            level=s.level,
            streak_days=s.streak_days,
            is_me=bool(user and u.id == user.id),
        )
        for rank, s, u in ranked
    ]
    return LeaderboardOut(entries=entries, my_rank=my_rank)
