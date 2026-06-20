from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class Attempt(Base, TimestampMixin):
    """A single answered question by a user."""

    __tablename__ = "attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE")
    )
    chosen_option_id: Mapped[int | None] = mapped_column(
        ForeignKey("options.id", ondelete="SET NULL"), nullable=True
    )
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)
    time_spent_ms: Mapped[int] = mapped_column(Integer, default=0)


class Progress(Base, TimestampMixin):
    """Aggregated per-user, per-section progress."""

    __tablename__ = "progress"
    __table_args__ = (
        UniqueConstraint("user_id", "section_id", name="uq_progress_user_section"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    section_id: Mapped[int] = mapped_column(
        ForeignKey("sections.id", ondelete="CASCADE")
    )
    answered: Mapped[int] = mapped_column(Integer, default=0)
    correct: Mapped[int] = mapped_column(Integer, default=0)
