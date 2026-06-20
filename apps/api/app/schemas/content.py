from pydantic import BaseModel, ConfigDict

from app.models.enums import QuestionType, SkillType


class OptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    label: str
    content: str


class QuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    stem: str
    audio_url: str | None = None
    image_url: str | None = None
    difficulty: int
    is_sample: bool
    options: list[OptionOut] = []


class SectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    question_type: QuestionType
    order: int


class SkillOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: SkillType
    name: str
    order: int
    sections: list[SectionOut] = []


class LevelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    order: int


class LevelDetailOut(LevelOut):
    skills: list[SkillOut] = []
