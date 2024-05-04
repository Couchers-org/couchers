"""Add new notification types

Revision ID: 1c999dea180d
Revises: 69ce91d4db5e
Create Date: 2024-04-11 10:00:14.627154

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "1c999dea180d"
down_revision = "69ce91d4db5e"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index(
        "ix_notification_deliveries_dt_ni_dnull",
        "notification_deliveries",
        ["delivery_type", "notification_id", sa.text("(delivered IS NULL)")],
        unique=False,
    )
    op.execute("UPDATE users SET last_digest_sent = to_timestamp(0)")
    op.alter_column(
        "users",
        "last_digest_sent",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=False,
        server_default=sa.text("to_timestamp(0)"),
    )
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'event__create'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'event__update'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'event__invite_organizer'")
    op.create_unique_constraint(
        op.f("uq_notification_preferences_user_id"),
        "notification_preferences",
        ["user_id", "topic_action", "delivery_type"],
    )


def downgrade():
    raise Exception("Can't downgrade")
