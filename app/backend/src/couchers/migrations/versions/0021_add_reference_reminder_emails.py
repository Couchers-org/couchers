"""Add reference reminder emails

Revision ID: 0021
Revises: 0020
Create Date: 2021-07-13 01:18:08.138793

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0021"
down_revision = "0020"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "host_requests",
        sa.Column("to_sent_reference_reminders", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
    )
    op.add_column(
        "host_requests",
        sa.Column("from_sent_reference_reminders", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
    )
    op.execute("ALTER TYPE backgroundjobtype ADD VALUE 'send_reference_reminders'")


def downgrade() -> None:
    op.drop_column("host_requests", "from_sent_reference_reminders")
    op.drop_column("host_requests", "to_sent_reference_reminders")
