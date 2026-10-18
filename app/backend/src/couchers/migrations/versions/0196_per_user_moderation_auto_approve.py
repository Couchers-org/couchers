"""Per-user moderation auto-approve deadline

Revision ID: 0196
Revises: 0195
Create Date: 2026-10-18 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0196"
down_revision = "0195"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("moderation_auto_approve_after", sa.Interval(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "moderation_auto_approve_after")
