"""Add API keys

Revision ID: 61b4c6b2df72
Revises: f77ccd92eb4d
Create Date: 2021-07-22 13:50:58.948747

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "61b4c6b2df72"
down_revision = "f77ccd92eb4d"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "api_calls",
        sa.Column("is_api_key", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        schema="logging",
    )
    op.add_column("sessions", sa.Column("is_api_key", sa.Boolean(), server_default=sa.text("false"), nullable=False))


def downgrade():
    op.drop_column("sessions", "is_api_key")
    op.drop_column("api_calls", "is_api_key", schema="logging")
