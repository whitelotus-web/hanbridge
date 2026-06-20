from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class MockTest(Base, TimestampMixin):
    __tablename__ = "mock_tests"

    id: Mapped[int] = mapped_column(primary_key=True)
    level_id: Mapped[int] = mapped_column(ForeignKey("levels.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(160))
    duration_sec: Mapped[int] = mapped_column(Integer, default=0)
    # Describes section layout & question references for assembling the exam.
    structure: Mapped[dict] = mapped_column(JSON, default=dict)

    attempts: Mapped[list[MockAttempt]] = relationship(
        back_populates="mock_test", cascade="all, delete-orphan"
    )


class MockAttempt(Base, TimestampMixin):
    __tablename__ = "mock_attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    mock_test_id: Mapped[int] = mapped_column(
        ForeignKey("mock_tests.id", ondelete="CASCADE")
    )
    score: Mapped[int] = mapped_column(Integer, default=0)
    listening_score: Mapped[int] = mapped_column(Integer, default=0)
    reading_score: Mapped[int] = mapped_column(Integer, default=0)
    writing_score: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    mock_test: Mapped[MockTest] = relationship(back_populates="attempts")
