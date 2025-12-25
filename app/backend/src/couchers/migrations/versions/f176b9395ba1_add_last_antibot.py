"""Add last_antibot

Revision ID: f176b9395ba1
Revises: 83eff0255b38
Create Date: 2025-06-29 11:44:42.478494

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "f176b9395ba1"
down_revision = "83eff0255b38"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "last_antibot", sa.DateTime(timezone=True), server_default=sa.text("to_timestamp(0)"), nullable=False
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "last_antibot")
