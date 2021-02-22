"""Add last_notified_message_id to GroupChatSubscription

Revision ID: 065886328b03
Revises: c4445e08ea86
Create Date: 2021-02-22 12:49:32.776035

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "065886328b03"
down_revision = "c4445e08ea86"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("group_chat_subscriptions", sa.Column("last_notified_message_id", sa.BigInteger(), nullable=False))
    op.execute("ALTER TYPE backgroundjobtype ADD VALUE 'send_message_notifications'")


def downgrade():
    raise Exception("Can't downgrade.")
