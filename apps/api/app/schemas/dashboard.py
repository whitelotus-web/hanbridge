from __future__ import annotations

from pydantic import BaseModel

from app.schemas.mock import MockAttemptOut
from app.schemas.practice import ProgressOut


class StatsOut(BaseModel):
    total_answered: int
    total_correct: int
    accuracy: int
    sections: list[ProgressOut]
    recent_mocks: list[MockAttemptOut]
