"""Add machine-readable data payload to admin notes

Revision ID: 0151
Revises: 0150
Create Date: 2026-05-15 05:41:24.160635

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0151"
down_revision = "0150"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "admin_actions", sa.Column("data", postgresql.JSONB(none_as_null=True, astext_type=sa.Text()), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("admin_actions", "data")
