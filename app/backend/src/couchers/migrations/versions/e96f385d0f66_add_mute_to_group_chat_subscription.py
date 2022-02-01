"""Add mute to group chat subscription

Revision ID: e96f385d0f66
Revises: a0d1c7fdfe5b
Create Date: 2022-02-01 10:59:43.112243

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "e96f385d0f66"
down_revision = "a0d1c7fdfe5b"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("group_chat_subscriptions", sa.Column("muted_until", sa.DateTime(timezone=True), nullable=True))


def downgrade():
    op.drop_column("group_chat_subscriptions", "muted_until")
