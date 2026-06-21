from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_current_user_optional
from app.db.session import get_db
from app.models.user import User
from app.schemas.mock import (
    MockAttemptOut,
    MockQuestionOut,
    MockResultOut,
    MockSubmitIn,
    MockTestDetail,
    MockTestSummary,
)
from app.services import billing as billing_service
from app.services import mock as mock_service

router = APIRouter(tags=["mock"])


def _require_access(mock_test_is_free: bool, user: User | None) -> None:
    if not mock_test_is_free and (
        user is None or not billing_service.is_vip(user)
    ):
        raise HTTPException(status_code=402, detail="vip_required")


@router.get("/levels/{level_code}/mock-tests", response_model=list[MockTestSummary])
def list_mock_tests(
    level_code: str, db: Session = Depends(get_db)
) -> list[MockTestSummary]:
    tests = mock_service.list_for_level(db, level_code)
    return [
        MockTestSummary(
            id=t.id,
            title=t.title,
            duration_sec=t.duration_sec,
            level_code=level_code,
            question_count=len(mock_service.question_ids(t)),
            is_free=t.is_free,
        )
        for t in tests
    ]


@router.get("/mock-tests/{mock_test_id}", response_model=MockTestDetail)
def get_mock_test(
    mock_test_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
) -> MockTestDetail:
    mock_test = mock_service.get_mock_test(db, mock_test_id)
    if mock_test is None:
        raise HTTPException(status_code=404, detail="Mock test not found")
    _require_access(mock_test.is_free, user)
    questions = mock_service.load_questions(
        db, mock_service.question_ids(mock_test)
    )
    return MockTestDetail(
        id=mock_test.id,
        title=mock_test.title,
        duration_sec=mock_test.duration_sec,
        level_code=mock_test.level.code,
        questions=[
            MockQuestionOut(
                id=q.id,
                stem=q.stem,
                audio_url=q.audio_url,
                image_url=q.image_url,
                question_type=q.section.question_type,
                skill_type=q.section.skill.type,
                options=q.options,  # type: ignore[arg-type]
            )
            for q in questions
        ],
    )


@router.post("/mock-tests/{mock_test_id}/submit", response_model=MockResultOut)
def submit_mock_test(
    mock_test_id: int,
    payload: MockSubmitIn,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
) -> MockResultOut:
    mock_test = mock_service.get_mock_test(db, mock_test_id)
    if mock_test is None:
        raise HTTPException(status_code=404, detail="Mock test not found")
    _require_access(mock_test.is_free, user)
    if not payload.answers:
        raise HTTPException(status_code=422, detail="No answers submitted")
    return mock_service.grade_mock(
        db, mock_test, payload.answers, user, payload.duration_sec
    )


@router.get("/me/mock-attempts", response_model=list[MockAttemptOut])
def my_mock_attempts(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[MockAttemptOut]:
    attempts = mock_service.list_attempts(db, user)
    return [
        MockAttemptOut(
            id=a.id,
            mock_test_id=a.mock_test_id,
            title=a.mock_test.title,
            score=a.score,
            finished_at=a.finished_at,
        )
        for a in attempts
    ]
