"""Add event/community toggle

Revision ID: 34db9c02d305
Revises: f40be9aecae7
Create Date: 2025-07-16 09:19:34.257615

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "34db9c02d305"
down_revision = "f40be9aecae7"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "clusters", sa.Column("discussions_enabled", sa.Boolean(), server_default=sa.text("true"), nullable=False)
    )
    op.add_column("clusters", sa.Column("events_enabled", sa.Boolean(), server_default=sa.text("true"), nullable=False))


def downgrade():
    op.drop_column("clusters", "events_enabled")
    op.drop_column("clusters", "discussions_enabled")
