from __future__ import annotations

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import QuestionType, SkillType


class Level(Base, TimestampMixin):
    """An HSK level, e.g. HSK1..HSK6 and the advanced 7-9 band."""

    __tablename__ = "levels"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(16), unique=True, index=True)  # "HSK1"
    name: Mapped[str] = mapped_column(String(64))
    order: Mapped[int] = mapped_column(Integer, default=0)

    skills: Mapped[list[Skill]] = relationship(
        back_populates="level", cascade="all, delete-orphan"
    )


class Skill(Base, TimestampMixin):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(primary_key=True)
    level_id: Mapped[int] = mapped_column(ForeignKey("levels.id", ondelete="CASCADE"))
    type: Mapped[SkillType] = mapped_column(Enum(SkillType, name="skill_type"))
    name: Mapped[str] = mapped_column(String(64))
    order: Mapped[int] = mapped_column(Integer, default=0)

    level: Mapped[Level] = relationship(back_populates="skills")
    sections: Mapped[list[Section]] = relationship(
        back_populates="skill", cascade="all, delete-orphan"
    )


class Section(Base, TimestampMixin):
    """A group of questions of one type within a skill, e.g. 'True or false'."""

    __tablename__ = "sections"

    id: Mapped[int] = mapped_column(primary_key=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(128))
    question_type: Mapped[QuestionType] = mapped_column(
        Enum(QuestionType, name="question_type")
    )
    order: Mapped[int] = mapped_column(Integer, default=0)
    # Free sections are open to everyone; non-free require an active VIP plan.
    is_free: Mapped[bool] = mapped_column(Boolean, default=True)

    skill: Mapped[Skill] = relationship(back_populates="sections")
    questions: Mapped[list[Question]] = relationship(
        back_populates="section", cascade="all, delete-orphan"
    )


class Question(Base, TimestampMixin):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    section_id: Mapped[int] = mapped_column(
        ForeignKey("sections.id", ondelete="CASCADE")
    )
    stem: Mapped[str] = mapped_column(Text)
    audio_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    translation: Mapped[str | None] = mapped_column(Text, nullable=True)
    difficulty: Mapped[int] = mapped_column(Integer, default=1)
    # Flags this row as placeholder content to be replaced with real data later.
    is_sample: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    section: Mapped[Section] = relationship(back_populates="questions")
    options: Mapped[list[Option]] = relationship(
        back_populates="question", cascade="all, delete-orphan"
    )


class Option(Base):
    __tablename__ = "options"

    id: Mapped[int] = mapped_column(primary_key=True)
    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE")
    )
    label: Mapped[str] = mapped_column(String(8))  # "A", "B", ...
    content: Mapped[str] = mapped_column(Text)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)

    question: Mapped[Question] = relationship(back_populates="options")
