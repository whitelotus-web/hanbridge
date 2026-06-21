from __future__ import annotations

from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class UserStats(Base, TimestampMixin):
    """Per-user gamification counters (XP, level, streak)."""

    __tablename__ = "user_stats"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    xp: Mapped[int] = mapped_column(Integer, default=0)
    level: Mapped[int] = mapped_column(Integer, default=1)
    streak_days: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_active_date: Mapped[date | None] = mapped_column(Date, nullable=True)


class Badge(Base, TimestampMixin):
    """An achievement that users can earn.

    ``threshold_type`` is one of ``xp`` / ``streak`` / ``questions`` /
    ``mock_passed``; the badge is awarded once the matching counter reaches
    ``threshold_value``.
    """

    __tablename__ = "badges"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(48), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(80))
    description: Mapped[str] = mapped_column(Text)
    icon: Mapped[str] = mapped_column(String(16), default="🏅")
    threshold_type: Mapped[str] = mapped_column(String(24))
    threshold_value: Mapped[int] = mapped_column(Integer, default=0)

    user_badges: Mapped[list[UserBadge]] = relationship(
        back_populates="badge", cascade="all, delete-orphan"
    )


class UserBadge(Base, TimestampMixin):
    __tablename__ = "user_badges"
    __table_args__ = (
        UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    badge_id: Mapped[int] = mapped_column(ForeignKey("badges.id", ondelete="CASCADE"))

    badge: Mapped[Badge] = relationship(back_populates="user_badges")
