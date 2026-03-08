"""Add mute to group chat subscription

Revision ID: 0037
Revises: 0036
Create Date: 2022-02-01 10:59:43.112243

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0037"
down_revision = "0036"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "group_chat_subscriptions",
        sa.Column(
            "muted_until", sa.DateTime(timezone=True), server_default="0001-01-01T00:00:00+00:00", nullable=False
        ),
    )


def downgrade() -> None:
    op.drop_column("group_chat_subscriptions", "muted_until")
