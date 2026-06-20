from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.models.content import Level
from app.schemas.content import LevelDetailOut, LevelOut

router = APIRouter(prefix="/levels", tags=["levels"])


@router.get("", response_model=list[LevelOut])
def list_levels(db: Session = Depends(get_db)) -> list[Level]:
    stmt = select(Level).order_by(Level.order)
    return list(db.scalars(stmt).all())


@router.get("/{code}", response_model=LevelDetailOut)
def get_level(code: str, db: Session = Depends(get_db)) -> Level:
    stmt = (
        select(Level)
        .where(Level.code == code.upper())
        .options(selectinload(Level.skills))
    )
    level = db.scalars(stmt).first()
    if level is None:
        raise HTTPException(status_code=404, detail="Level not found")
    return level
