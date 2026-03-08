"""Add API keys

Revision ID: 0023
Revises: 0022
Create Date: 2021-07-22 13:50:58.948747

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0023"
down_revision = "0022"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "api_calls",
        sa.Column("is_api_key", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        schema="logging",
    )
    op.add_column("sessions", sa.Column("is_api_key", sa.Boolean(), server_default=sa.text("false"), nullable=False))


def downgrade() -> None:
    op.drop_column("sessions", "is_api_key")
    op.drop_column("api_calls", "is_api_key", schema="logging")
