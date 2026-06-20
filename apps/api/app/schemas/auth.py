from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class RegisterIn(BaseModel):
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=32)
    password: str = Field(min_length=8, max_length=128)
    display_name: str | None = Field(default=None, max_length=120)
    locale: str = Field(default="en", max_length=8)

    @model_validator(mode="after")
    def _require_identifier(self) -> RegisterIn:
        if not self.email and not self.phone:
            raise ValueError("Either email or phone is required")
        return self


class LoginIn(BaseModel):
    identifier: str = Field(description="Email or phone")
    password: str


class RefreshIn(BaseModel):
    refresh_token: str


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=128)


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str | None
    phone: str | None
    display_name: str | None
    locale: str
    is_staff: bool
    vip_until: datetime | None


class AuthResult(TokenPair):
    user: UserOut
