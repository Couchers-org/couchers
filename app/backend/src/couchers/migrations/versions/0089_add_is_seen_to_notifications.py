"""Add is_seen to notifications

Revision ID: 0089
Revises: 0088
Create Date: 2025-04-17 08:29:25.303011

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0089"
down_revision = "0088"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("notifications", sa.Column("is_seen", sa.Boolean(), server_default=sa.text("false"), nullable=False))


def downgrade() -> None:
    op.drop_column("notifications", "is_seen")
