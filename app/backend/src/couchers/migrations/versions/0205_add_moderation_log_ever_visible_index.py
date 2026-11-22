"""Add a partial index on moderation_log for content that was ever visible or unlisted

Revision ID: 0205
Revises: 0204
"""

from alembic import op

revision = "0205"
down_revision = "0204"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_moderation_log_ever_visible",
        "moderation_log",
        ["moderation_state_id"],
        unique=False,
        postgresql_where="new_visibility IN ('visible', 'unlisted')",
    )


def downgrade() -> None:
    op.drop_index("ix_moderation_log_ever_visible", table_name="moderation_log")
