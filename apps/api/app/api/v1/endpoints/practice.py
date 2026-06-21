from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user, get_current_user_optional
from app.db.session import get_db
from app.models.content import Question, Section, Skill
from app.models.practice import Progress
from app.models.user import User
from app.schemas.practice import (
    GradeIn,
    GradeOut,
    ProgressOut,
    SectionQuestionsOut,
)
from app.services import billing as billing_service
from app.services import practice as practice_service

router = APIRouter(tags=["practice"])


@router.get("/sections/{section_id}", response_model=SectionQuestionsOut)
def get_section(
    section_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
) -> SectionQuestionsOut:
    section = db.scalars(
        select(Section)
        .where(Section.id == section_id)
        .options(
            selectinload(Section.questions).selectinload(Question.options),
            selectinload(Section.skill).selectinload(Skill.level),
        )
    ).first()
    if section is None:
        raise HTTPException(status_code=404, detail="Section not found")

    if not section.is_free and (user is None or not billing_service.is_vip(user)):
        raise HTTPException(status_code=402, detail="vip_required")

    skill = section.skill
    return SectionQuestionsOut(
        id=section.id,
        title=section.title,
        question_type=section.question_type,
        skill_name=skill.name,
        level_code=skill.level.code,
        questions=section.questions,  # type: ignore[arg-type]
    )


@router.post("/practice/grade", response_model=GradeOut)
def grade(
    payload: GradeIn,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
) -> GradeOut:
    if not payload.answers:
        raise HTTPException(status_code=422, detail="No answers submitted")
    return practice_service.grade_answers(db, payload.answers, user)


@router.get("/me/progress", response_model=list[ProgressOut])
def my_progress(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[ProgressOut]:
    rows: list[Progress] = practice_service.list_progress(db, user)
    section_titles = {
        s.id: s.title
        for s in db.scalars(
            select(Section).where(
                Section.id.in_([r.section_id for r in rows] or [0])
            )
        ).all()
    }
    return [
        ProgressOut(
            section_id=r.section_id,
            section_title=section_titles.get(r.section_id, ""),
            answered=r.answered,
            correct=r.correct,
        )
        for r in rows
    ]
