"""Per-item auto-approve deadlines on moderation queue items

Revision ID: 0196
Revises: 0195
Create Date: 2026-10-11 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0196"
down_revision = "0195"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("moderation_queue", sa.Column("auto_approve_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("moderation_log", sa.Column("new_auto_approve_at", sa.DateTime(timezone=True), nullable=True))
    op.execute("ALTER TYPE moderationaction ADD VALUE IF NOT EXISTS 'set_auto_approve'")

    # carry over the previous global 15 minute deadline for content still awaiting review
    op.execute(
        """
        UPDATE moderation_queue SET auto_approve_at = time_created + interval '15 minutes'
        WHERE trigger = 'initial_review' AND resolved_by_log_id IS NULL
        """
    )

    op.create_index(
        "ix_moderation_queue_open_auto_approve_at",
        "moderation_queue",
        ["auto_approve_at"],
        unique=False,
        postgresql_where=sa.text("resolved_by_log_id IS NULL AND auto_approve_at IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index(
        "ix_moderation_queue_open_auto_approve_at",
        table_name="moderation_queue",
        postgresql_where=sa.text("resolved_by_log_id IS NULL AND auto_approve_at IS NOT NULL"),
    )
    op.drop_column("moderation_log", "new_auto_approve_at")
    op.drop_column("moderation_queue", "auto_approve_at")
