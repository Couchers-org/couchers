"""Add group chat archive status

Revision ID: a1b2c3d4e5f6
Revises: 7d04ba82351c
Create Date: 2026-01-13 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "7d04ba82351c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "group_chat_subscriptions",
        sa.Column("is_archived", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("group_chat_subscriptions", "is_archived")
