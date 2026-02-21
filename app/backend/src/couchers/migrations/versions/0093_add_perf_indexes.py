"""Add perf indexes

Revision ID: f7d5de383e11
Revises: dc3e31bb80f3
Create Date: 2025-05-23 19:52:15.597310

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "f7d5de383e11"
down_revision = "dc3e31bb80f3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_friend_relationships_status_to_from",
        "friend_relationships",
        ["status", "to_user_id", "from_user_id"],
        unique=False,
    )
    op.create_index(
        "ix_notifications_latest", "notifications", ["user_id", sa.text("id DESC"), "topic_action"], unique=False
    )
    op.create_index(
        "ix_notifications_unseen",
        "notifications",
        ["user_id", "topic_action"],
        unique=False,
        postgresql_where=sa.text("is_seen = false"),
    )


def downgrade() -> None:
    op.drop_index("ix_notifications_unseen", table_name="notifications", postgresql_where=sa.text("is_seen = false"))
    op.drop_index("ix_notifications_latest", table_name="notifications")
    op.drop_index("ix_friend_relationships_status_to_from", table_name="friend_relationships")
