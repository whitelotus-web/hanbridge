from __future__ import annotations

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    create_reset_token,
    decode_token,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthResult,
    ForgotPasswordIn,
    LoginIn,
    RefreshIn,
    RegisterIn,
    ResetPasswordIn,
    TokenPair,
    UserOut,
)
from app.services import user as user_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _issue_tokens(user: User) -> AuthResult:
    return AuthResult(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=UserOut.model_validate(user),
    )


@router.post("/register", response_model=AuthResult, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn, db: Session = Depends(get_db)) -> AuthResult:
    if payload.email and user_service.get_by_identifier(db, payload.email):
        raise HTTPException(status_code=409, detail="Email already registered")
    if payload.phone and user_service.get_by_identifier(db, payload.phone):
        raise HTTPException(status_code=409, detail="Phone already registered")

    user = user_service.create_user(
        db,
        password=payload.password,
        email=payload.email,
        phone=payload.phone,
        display_name=payload.display_name,
        locale=payload.locale,
    )
    return _issue_tokens(user)


@router.post("/login", response_model=AuthResult)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> AuthResult:
    user = user_service.authenticate(db, payload.identifier, payload.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return _issue_tokens(user)


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshIn, db: Session = Depends(get_db)) -> TokenPair:
    try:
        data = decode_token(payload.refresh_token, "refresh")
        user_id = int(data["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError) as exc:
        raise HTTPException(status_code=401, detail="Invalid refresh token") from exc

    user = user_service.get_by_id(db, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    return TokenPair(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordIn, db: Session = Depends(get_db)
) -> dict[str, str]:
    """Always returns 200 to avoid leaking which emails are registered.

    In development the reset token is returned directly; in production it would
    be delivered via email instead.
    """
    user = user_service.get_by_email(db, payload.email)
    response: dict[str, str] = {
        "detail": "If the account exists, a reset link has been sent."
    }
    if user is not None:
        token = create_reset_token(user.id)
        if settings.ENVIRONMENT != "production":
            response["reset_token"] = token
    return response


@router.post("/reset-password")
def reset_password(
    payload: ResetPasswordIn, db: Session = Depends(get_db)
) -> dict[str, str]:
    try:
        data = decode_token(payload.token, "reset")
        user_id = int(data["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="Invalid or expired token") from exc

    user = user_service.get_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user_service.set_password(db, user, payload.password)
    return {"detail": "Password updated"}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
