from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_current_user_optional
from app.db.session import get_db
from app.models.user import User
from app.schemas.ai import (
    ExplainIn,
    ExplainOut,
    StudyPlanOut,
    TutorChatIn,
    TutorChatOut,
    TutorMessageOut,
)
from app.services import ai as ai_service

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/status", response_model=dict[str, bool])
def ai_status() -> dict[str, bool]:
    """Whether a live Gemini key is configured (else dev fallback is used)."""
    return {"ai_enabled": ai_service.ai_enabled()}


@router.post("/explain", response_model=ExplainOut)
def explain(
    payload: ExplainIn,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
) -> ExplainOut:
    result = ai_service.explain_question(
        db,
        question_id=payload.question_id,
        chosen_option_id=payload.chosen_option_id,
        text_answer=payload.text_answer,
        locale=payload.locale,
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Question not found")
    return result


@router.post("/tutor/chat", response_model=TutorChatOut)
def tutor_chat(
    payload: TutorChatIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> TutorChatOut:
    return ai_service.tutor_chat(db, user, payload.message, payload.locale)


@router.get("/tutor/history", response_model=list[TutorMessageOut])
def tutor_history(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[TutorMessageOut]:
    return ai_service.tutor_history(db, user)


@router.get("/study-plan", response_model=StudyPlanOut)
def study_plan(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> StudyPlanOut:
    return ai_service.study_plan(db, user, user.locale)
