from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import QuestionType, SkillType, OrderStatus, PlanInterval


class AdminOverviewOut(BaseModel):
    total_users: int
    vip_users: int
    total_questions: int
    total_mock_tests: int
    total_articles: int
    total_orders: int
    total_revenue: Decimal


class AdminUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str | None
    phone: str | None
    display_name: str | None
    locale: str
    is_active: bool
    is_staff: bool
    vip_until: datetime | None
    created_at: datetime
    updated_at: datetime


class AdminUserUpdate(BaseModel):
    display_name: str | None = None
    is_active: bool | None = None
    is_staff: bool | None = None
    vip_until: datetime | None = None


class AdminOrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    plan_id: int
    status: OrderStatus
    amount: Decimal
    currency: str
    gateway: str
    created_at: datetime
    updated_at: datetime


# --- Level CRUD ---
class LevelCreate(BaseModel):
    code: str
    name: str
    order: int = 0


class LevelUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    order: int | None = None


class LevelAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    order: int
    created_at: datetime
    updated_at: datetime


# --- Skill CRUD ---
class SkillCreate(BaseModel):
    level_id: int
    type: SkillType
    name: str
    order: int = 0


class SkillUpdate(BaseModel):
    level_id: int | None = None
    type: SkillType | None = None
    name: str | None = None
    order: int | None = None


class SkillAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    level_id: int
    type: SkillType
    name: str
    order: int
    created_at: datetime
    updated_at: datetime


# --- Section CRUD ---
class SectionCreate(BaseModel):
    skill_id: int
    title: str
    question_type: QuestionType
    order: int = 0
    is_free: bool = True


class SectionUpdate(BaseModel):
    skill_id: int | None = None
    title: str | None = None
    question_type: QuestionType | None = None
    order: int | None = None
    is_free: bool | None = None


class SectionAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    skill_id: int
    title: str
    question_type: QuestionType
    order: int
    is_free: bool
    created_at: datetime
    updated_at: datetime


# --- Question & Option CRUD ---
class OptionCreateInQuestion(BaseModel):
    label: str
    content: str
    is_correct: bool = False


class OptionAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    label: str
    content: str
    is_correct: bool


class QuestionCreate(BaseModel):
    section_id: int
    stem: str
    audio_url: str | None = None
    image_url: str | None = None
    explanation: str | None = None
    translation: str | None = None
    difficulty: int = 1
    is_sample: bool = False
    options: list[OptionCreateInQuestion] = []


class QuestionUpdate(BaseModel):
    section_id: int | None = None
    stem: str | None = None
    audio_url: str | None = None
    image_url: str | None = None
    explanation: str | None = None
    translation: str | None = None
    difficulty: int | None = None
    is_sample: bool | None = None
    options: list[OptionCreateInQuestion] | None = None


class QuestionAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    section_id: int
    stem: str
    audio_url: str | None
    image_url: str | None
    explanation: str | None
    translation: str | None
    difficulty: int
    is_sample: bool
    created_at: datetime
    updated_at: datetime
    options: list[OptionAdminOut] = []


# --- Mock Test CRUD ---
class MockTestCreate(BaseModel):
    level_id: int
    title: str
    duration_sec: int
    structure: dict[str, Any] = Field(default_factory=dict)
    is_free: bool = True


class MockTestUpdate(BaseModel):
    level_id: int | None = None
    title: str | None = None
    duration_sec: int | None = None
    structure: dict[str, Any] | None = None
    is_free: bool | None = None


class MockTestAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    level_id: int
    title: str
    duration_sec: int
    structure: dict[str, Any]
    is_free: bool
    created_at: datetime
    updated_at: datetime


# --- Article CRUD ---
class ArticleCreate(BaseModel):
    slug: str
    title: str
    body: str = ""
    lang: str = "en"
    is_sample: bool = False
    published_at: datetime | None = None


class ArticleUpdate(BaseModel):
    slug: str | None = None
    title: str | None = None
    body: str | None = None
    lang: str | None = None
    is_sample: bool | None = None
    published_at: datetime | None = None


class ArticleAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    title: str
    body: str
    lang: str
    is_sample: bool
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime


# --- Plan CRUD ---
class PlanCreate(BaseModel):
    name: str
    interval: PlanInterval
    duration_days: int | None = None
    price: Decimal
    currency: str = "USD"
    is_active: bool = True


class PlanUpdate(BaseModel):
    name: str | None = None
    interval: PlanInterval | None = None
    duration_days: int | None = None
    price: Decimal | None = None
    currency: str | None = None
    is_active: bool | None = None


class PlanAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    interval: PlanInterval
    duration_days: int | None
    price: Decimal
    currency: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


# --- Question Import ---
class QuestionImportRow(BaseModel):
    stem: str
    difficulty: int = 1
    explanation: str | None = None
    translation: str | None = None
    audio_url: str | None = None
    image_url: str | None = None
    options: list[OptionCreateInQuestion]


class QuestionImportIn(BaseModel):
    section_id: int
    questions: list[QuestionImportRow]


class QuestionImportOut(BaseModel):
    imported_count: int
