"""Add host request message bg job

Revision ID: 584f70c6a0d4
Revises: 763e0bd674a5
Create Date: 2021-05-26 14:43:43.079500

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "584f70c6a0d4"
down_revision = "763e0bd674a5"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column("last_notified_request_message_id", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
    )
    op.execute("ALTER TYPE backgroundjobtype ADD VALUE 'send_request_notifications'")


def downgrade():
    pass
