"""Gamification: XP, levels, daily streaks, badges and a leaderboard.

XP is awarded from practice (per answered + per correct) and mock passes. Levels
use a simple quadratic curve so each level needs a bit more XP than the last.
Streaks count consecutive active days (UTC). Badges are awarded once a tracked
counter crosses the badge's threshold.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.gamification import Badge, UserBadge, UserStats
from app.models.mock import MockAttempt
from app.models.practice import Progress
from app.models.user import User

XP_PER_ANSWER = 2
XP_PER_CORRECT = 8
XP_PER_MOCK_PASS = 50

# Level N requires LEVEL_STEP * (N-1)^2 cumulative XP. Tunable.
LEVEL_STEP = 100


def level_from_xp(xp: int) -> int:
    level = 1
    while LEVEL_STEP * level * level <= xp:
        level += 1
    return level


def xp_for_level(level: int) -> int:
    """Cumulative XP required to *reach* ``level``."""
    return LEVEL_STEP * (level - 1) * (level - 1)


def get_or_create_stats(db: Session, user: User) -> UserStats:
    stats = db.scalar(select(UserStats).where(UserStats.user_id == user.id))
    if stats is None:
        stats = UserStats(user_id=user.id, xp=0, level=1, streak_days=0, longest_streak=0)
        db.add(stats)
        db.flush()
    return stats


def _bump_streak(stats: UserStats) -> None:
    today = datetime.now(UTC).date()
    last = stats.last_active_date
    if last == today:
        return
    if last == today - timedelta(days=1):
        stats.streak_days += 1
    else:
        stats.streak_days = 1
    stats.last_active_date = today
    stats.longest_streak = max(stats.longest_streak, stats.streak_days)


def _counter_value(db: Session, user: User, threshold_type: str, stats: UserStats) -> int:
    if threshold_type == "xp":
        return stats.xp
    if threshold_type == "streak":
        return stats.longest_streak
    if threshold_type == "questions":
        total = db.scalar(
            select(func.coalesce(func.sum(Progress.answered), 0)).where(
                Progress.user_id == user.id
            )
        )
        return int(total or 0)
    if threshold_type == "mock_passed":
        passed = db.scalar(
            select(func.count())
            .select_from(MockAttempt)
            .where(MockAttempt.user_id == user.id, MockAttempt.score >= 60)
        )
        return int(passed or 0)
    return 0


def _award_badges(db: Session, user: User, stats: UserStats) -> None:
    badges = db.scalars(select(Badge)).all()
    if not badges:
        return
    owned = {
        ub.badge_id
        for ub in db.scalars(
            select(UserBadge).where(UserBadge.user_id == user.id)
        ).all()
    }
    for badge in badges:
        if badge.id in owned:
            continue
        if _counter_value(db, user, badge.threshold_type, stats) >= badge.threshold_value:
            db.add(UserBadge(user_id=user.id, badge_id=badge.id))


def _award(db: Session, user: User, xp_gained: int) -> UserStats:
    stats = get_or_create_stats(db, user)
    stats.xp += xp_gained
    stats.level = level_from_xp(stats.xp)
    _bump_streak(stats)
    _award_badges(db, user, stats)
    db.commit()
    db.refresh(stats)
    return stats


def award_for_practice(db: Session, user: User, answered: int, correct: int) -> None:
    if answered <= 0:
        return
    xp = answered * XP_PER_ANSWER + correct * XP_PER_CORRECT
    _award(db, user, xp)


def award_for_mock(db: Session, user: User, passed: bool) -> None:
    xp = XP_PER_MOCK_PASS if passed else XP_PER_ANSWER * 5
    _award(db, user, xp)


def get_gamification(db: Session, user: User) -> tuple[UserStats, list[UserBadge]]:
    stats = get_or_create_stats(db, user)
    db.commit()
    earned = db.scalars(
        select(UserBadge)
        .where(UserBadge.user_id == user.id)
        .order_by(UserBadge.id)
    ).all()
    return stats, list(earned)


def leaderboard(
    db: Session, current_user: User | None, limit: int = 20
) -> tuple[list[tuple[int, UserStats, User]], int | None]:
    rows = db.execute(
        select(UserStats, User)
        .join(User, User.id == UserStats.user_id)
        .order_by(UserStats.xp.desc(), UserStats.id)
        .limit(limit)
    ).all()
    ranked = [(i + 1, r[0], r[1]) for i, r in enumerate(rows)]

    my_rank: int | None = None
    if current_user is not None:
        my_xp = db.scalar(
            select(UserStats.xp).where(UserStats.user_id == current_user.id)
        )
        if my_xp is not None:
            ahead = db.scalar(
                select(func.count())
                .select_from(UserStats)
                .where(UserStats.xp > my_xp)
            )
            my_rank = int(ahead or 0) + 1
    return ranked, my_rank
