from __future__ import annotations

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class TutorMessage(Base, TimestampMixin):
    """A single turn in a user's AI-tutor conversation.

    ``role`` is ``"user"`` or ``"assistant"``. History is kept so the tutor can
    answer follow-up questions with context.
    """

    __tablename__ = "tutor_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(16))
    content: Mapped[str] = mapped_column(Text)
