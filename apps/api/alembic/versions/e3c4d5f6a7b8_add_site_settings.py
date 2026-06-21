"""add site_settings table

Revision ID: e3c4d5f6a7b8
Revises: d2b3c4e5f6a7
Create Date: 2026-06-21

"""

from __future__ import annotations

import sqlalchemy as sa

from alembic import op

revision: str = "e3c4d5f6a7b8"
down_revision: str | None = "d2b3c4e5f6a7"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.create_table(
        "site_settings",
        sa.Column("key", sa.String(length=100), primary_key=True),
        sa.Column("value", sa.Text(), nullable=False, server_default=""),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("site_settings")
