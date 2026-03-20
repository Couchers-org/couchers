"""Add group chat archive status

Revision ID: 0125
Revises: 0124
Create Date: 2026-01-13 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0125"
down_revision = "0124"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "group_chat_subscriptions",
        sa.Column("is_archived", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("group_chat_subscriptions", "is_archived")
