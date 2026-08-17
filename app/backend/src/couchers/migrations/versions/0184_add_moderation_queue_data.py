"""Add data column to moderation queue items

Revision ID: 0184
Revises: 0183
Create Date: 2026-08-16 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0184"
down_revision = "0183"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("moderation_queue", sa.Column("data", postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    op.drop_column("moderation_queue", "data")
