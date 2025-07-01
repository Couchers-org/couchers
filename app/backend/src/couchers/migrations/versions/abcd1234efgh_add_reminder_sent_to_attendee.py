"""add reminder_sent to event_occurrence_attendees

Revision ID: abcd1234efgh
Revises: 14585a4e1868
Create Date: 2025-06-29 15:15:00.000000

"""

import sqlalchemy as sa
from alembic import op

revision = "abcd1234efgh"
down_revision = "14585a4e1868"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "event_occurrence_attendees",
        sa.Column("reminder_sent", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade():
    op.drop_column("event_occurrence_attendees", "reminder_sent")
