"""Add event__reminder to NotificationTopicAction

Revision ID: 14585a4e1868
Revises: 33116a094637
Create Date: 2025-06-24 19:57:59.799511

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "14585a4e1868"
down_revision = "33116a094637"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE IF NOT EXISTS 'event__reminder'")
    op.add_column(
        "event_occurrence_attendees",
        sa.Column("reminder_sent", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_column("event_occurrence_attendees", "reminder_sent")
