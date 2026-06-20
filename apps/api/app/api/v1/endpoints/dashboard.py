from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.content import Section
from app.models.practice import Progress
from app.models.user import User
from app.schemas.dashboard import StatsOut
from app.schemas.mock import MockAttemptOut
from app.schemas.practice import ProgressOut
from app.services import mock as mock_service
from app.services import practice as practice_service

router = APIRouter(tags=["dashboard"])


@router.get("/me/stats", response_model=StatsOut)
def my_stats(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> StatsOut:
    progress: list[Progress] = practice_service.list_progress(db, user)
    section_titles = {
        s.id: s.title
        for s in db.scalars(
            select(Section).where(
                Section.id.in_([p.section_id for p in progress] or [0])
            )
        ).all()
    }
    sections = [
        ProgressOut(
            section_id=p.section_id,
            section_title=section_titles.get(p.section_id, ""),
            answered=p.answered,
            correct=p.correct,
        )
        for p in progress
    ]
    total_answered = sum(p.answered for p in progress)
    total_correct = sum(p.correct for p in progress)
    accuracy = round(total_correct / total_answered * 100) if total_answered else 0

    attempts = mock_service.list_attempts(db, user)
    recent_mocks = [
        MockAttemptOut(
            id=a.id,
            mock_test_id=a.mock_test_id,
            title=a.mock_test.title,
            score=a.score,
            finished_at=a.finished_at,
        )
        for a in attempts[:5]
    ]

    return StatsOut(
        total_answered=total_answered,
        total_correct=total_correct,
        accuracy=accuracy,
        sections=sections,
        recent_mocks=recent_mocks,
    )
