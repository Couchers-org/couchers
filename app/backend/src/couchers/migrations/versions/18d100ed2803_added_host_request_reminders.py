"""added host request reminders

Revision ID: 18d100ed2803
Revises: cd456767d2f7
Create Date: 2025-06-18 00:58:42.474471

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "18d100ed2803"
down_revision = "cd456767d2f7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'host_request__reminder'")
    op.add_column(
        "host_requests",
        sa.Column("host_sent_request_reminders", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
    )
    op.add_column(
        "host_requests",
        sa.Column("last_sent_request_reminder_time", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index(
        "ix_host_requests_status_reminder_counts",
        "host_requests",
        [
            "status",
            "host_sent_request_reminders",
            "last_sent_request_reminder_time",
            "from_date",
        ],
        unique=False,
    )


def downgrade() -> None:
    raise Exception("Can't downgrade")
