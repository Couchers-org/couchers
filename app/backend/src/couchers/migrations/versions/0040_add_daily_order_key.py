"""Add daily order key

Revision ID: 0040
Revises: 0039
Create Date: 2022-02-07 17:09:58.633011

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0040"
down_revision = "0039"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("daily_order_key", sa.Float(), server_default="0", nullable=False))
    op.execute("UPDATE users SET daily_order_key = 10e6 - id")


def downgrade() -> None:
    op.drop_column("users", "daily_order_key")
