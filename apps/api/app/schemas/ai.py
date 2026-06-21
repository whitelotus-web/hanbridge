from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ExplainIn(BaseModel):
    """Ask the AI to explain a question's answer."""

    question_id: int
    chosen_option_id: int | None = None
    text_answer: str | None = None
    locale: str = Field(default="en", max_length=8)


class ExplainOut(BaseModel):
    explanation: str
    # None when the question is self-assessed (writing/speaking).
    is_correct: bool | None = None
    correct_answer: str | None = None
    # True when the text came from Gemini, False when from the dev fallback.
    ai_generated: bool = False


class TutorChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    locale: str = Field(default="en", max_length=8)


class TutorMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    role: str
    content: str
    created_at: datetime


class TutorChatOut(BaseModel):
    reply: str
    ai_generated: bool = False


class StudyPlanItem(BaseModel):
    section_id: int
    section_title: str
    level_code: str
    skill_name: str
    answered: int
    accuracy: int
    reason: str


class StudyPlanOut(BaseModel):
    summary: str
    recommendations: list[StudyPlanItem]
    ai_generated: bool = False
