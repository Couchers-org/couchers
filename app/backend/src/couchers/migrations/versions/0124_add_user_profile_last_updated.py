"""Add user profile_last_updated

Revision ID: 0124
Revises: 0123
Create Date: 2025-12-09 02:37:35.913970

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0124"
down_revision = "0123"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("profile_last_updated", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    # Backfill to last_active time
    op.execute("UPDATE users SET profile_last_updated = last_active")


def downgrade() -> None:
    op.drop_column("users", "profile_last_updated")
