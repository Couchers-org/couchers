"""Add last_viewing_at to group_chat_subscriptions

Revision ID: a8c3d2e1f094
Revises: f016e6defa9d
Create Date: 2026-02-05 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a8c3d2e1f094"
down_revision = "f016e6defa9d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "group_chat_subscriptions",
        sa.Column("last_viewing_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("group_chat_subscriptions", "last_viewing_at")
