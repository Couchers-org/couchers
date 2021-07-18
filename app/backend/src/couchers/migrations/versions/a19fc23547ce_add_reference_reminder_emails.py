"""Add reference reminder emails

Revision ID: a19fc23547ce
Revises: e6d03b494119
Create Date: 2021-07-13 01:18:08.138793

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a19fc23547ce"
down_revision = "e6d03b494119"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "host_requests",
        sa.Column("to_sent_reference_reminders", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
    )
    op.add_column(
        "host_requests",
        sa.Column("from_sent_reference_reminders", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
    )
    op.execute("ALTER TYPE backgroundjobtype ADD VALUE 'send_reference_reminders'")


def downgrade():
    op.drop_column("host_requests", "from_sent_reference_reminders")
    op.drop_column("host_requests", "to_sent_reference_reminders")
