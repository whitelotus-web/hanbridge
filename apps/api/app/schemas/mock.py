from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import QuestionType, SkillType
from app.schemas.content import OptionOut
from app.schemas.practice import AnswerIn, QuestionResult


class MockTestSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    duration_sec: int
    level_code: str
    question_count: int


class MockQuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    stem: str
    audio_url: str | None = None
    image_url: str | None = None
    question_type: QuestionType
    skill_type: SkillType
    options: list[OptionOut] = []


class MockTestDetail(BaseModel):
    id: int
    title: str
    duration_sec: int
    level_code: str
    questions: list[MockQuestionOut]


class MockSubmitIn(BaseModel):
    answers: list[AnswerIn]
    duration_sec: int | None = None


class MockResultOut(BaseModel):
    attempt_id: int | None
    score: int
    listening_score: int
    reading_score: int
    writing_score: int
    speaking_score: int
    total_questions: int
    correct: int
    passed: bool
    results: list[QuestionResult]


class MockAttemptOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mock_test_id: int
    title: str
    score: int
    finished_at: datetime | None
