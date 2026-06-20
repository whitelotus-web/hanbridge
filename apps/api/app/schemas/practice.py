from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from app.models.enums import QuestionType
from app.schemas.content import QuestionOut


class SectionQuestionsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    question_type: QuestionType
    skill_name: str
    level_code: str
    questions: list[QuestionOut]


class AnswerIn(BaseModel):
    question_id: int
    chosen_option_id: int | None = None


class GradeIn(BaseModel):
    answers: list[AnswerIn]


class QuestionResult(BaseModel):
    question_id: int
    is_correct: bool
    correct_option_id: int | None
    explanation: str | None = None
    translation: str | None = None


class GradeOut(BaseModel):
    total: int
    correct: int
    results: list[QuestionResult]


class ProgressOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    section_id: int
    section_title: str
    answered: int
    correct: int
