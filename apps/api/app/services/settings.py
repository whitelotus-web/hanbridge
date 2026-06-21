"""Runtime settings stored in the database (admin-configurable).

Sensitive keys (the Gemini API key) can be set from the admin console and take
effect immediately, falling back to the environment variable when unset. This
lets non-developers configure the AI tutor without a redeploy.
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.setting import SiteSetting

GEMINI_KEY = "gemini_api_key"


def get_setting(db: Session, key: str, default: str = "") -> str:
    row = db.get(SiteSetting, key)
    return row.value if row and row.value else default


def set_setting(db: Session, key: str, value: str) -> None:
    row = db.get(SiteSetting, key)
    if row is None:
        row = SiteSetting(key=key, value=value or "")
        db.add(row)
    else:
        row.value = value or ""
    db.commit()


def get_gemini_key(db: Session) -> str:
    """DB-configured Gemini key, falling back to the GEMINI_API_KEY env var."""
    return get_setting(db, GEMINI_KEY, settings.GEMINI_API_KEY)


def mask_secret(value: str) -> str:
    """Show only the last 4 chars of a secret (or empty if unset)."""
    if not value:
        return ""
    return f"\u2022\u2022\u2022\u2022{value[-4:]}" if len(value) > 4 else "\u2022\u2022\u2022\u2022"


def all_settings(db: Session) -> dict[str, SiteSetting]:
    return {s.key: s for s in db.scalars(select(SiteSetting)).all()}
