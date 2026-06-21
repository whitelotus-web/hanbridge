"""add tutor_messages

Revision ID: c1a2b3d4e5f6
Revises: 0ac788a88bf2
Create Date: 2026-06-21 03:30:00.000000

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "c1a2b3d4e5f6"
down_revision: str | None = "0ac788a88bf2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "tutor_messages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(length=16), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_tutor_messages_user_id"), "tutor_messages", ["user_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_tutor_messages_user_id"), table_name="tutor_messages")
    op.drop_table("tutor_messages")
