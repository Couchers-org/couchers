"""Add donation status

Revision ID: 0070
Revises: 0069
Create Date: 2024-07-17 09:46:20.672556

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0070"
down_revision = "0069"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("has_donated", sa.Boolean(), server_default=sa.text("false"), nullable=False))
    op.execute("UPDATE USERS SET has_donated = true WHERE id IN (SELECT user_id FROM invoices)")


def downgrade() -> None:
    op.drop_column("users", "has_donated")
