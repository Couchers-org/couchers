"""Add daily order key

Revision ID: e54417789a02
Revises: 6c05f801b0c6
Create Date: 2022-02-07 17:09:58.633011

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "e54417789a02"
down_revision = "6c05f801b0c6"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("daily_order_key", sa.Float(), server_default="0", nullable=False))
    op.execute("UPDATE users SET daily_order_key = 10e6 - id")


def downgrade():
    op.drop_column("users", "daily_order_key")
