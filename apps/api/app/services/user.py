from __future__ import annotations

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User


def get_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def get_by_email(db: Session, email: str) -> User | None:
    return db.scalars(select(User).where(User.email == email)).first()


def get_by_identifier(db: Session, identifier: str) -> User | None:
    """Look up a user by email or phone."""
    stmt = select(User).where(
        or_(User.email == identifier, User.phone == identifier)
    )
    return db.scalars(stmt).first()


def create_user(
    db: Session,
    *,
    password: str,
    email: str | None = None,
    phone: str | None = None,
    display_name: str | None = None,
    locale: str = "en",
) -> User:
    user = User(
        email=email,
        phone=phone,
        password_hash=hash_password(password),
        display_name=display_name,
        locale=locale,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate(db: Session, identifier: str, password: str) -> User | None:
    user = get_by_identifier(db, identifier)
    if user is None or not user.is_active:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def set_password(db: Session, user: User, password: str) -> None:
    user.password_hash = hash_password(password)
    db.add(user)
    db.commit()
