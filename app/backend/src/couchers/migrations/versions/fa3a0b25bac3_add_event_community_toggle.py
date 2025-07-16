"""Add event/community toggle

Revision ID: fa3a0b25bac3
Revises: d345174cb002
Create Date: 2025-07-16 09:16:49.822437

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "fa3a0b25bac3"
down_revision = "d345174cb002"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("clusters", sa.Column("discussions_enabled", sa.Boolean(), nullable=False))
    op.add_column("clusters", sa.Column("events_enabled", sa.Boolean(), nullable=False))


def downgrade():
    op.drop_column("clusters", "events_enabled")
    op.drop_column("clusters", "discussions_enabled")
