"""Add ip and user agent

Revision ID: 0060
Revises: 0059
Create Date: 2024-05-26 11:20:24.761107

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0060"
down_revision = "0059"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("api_calls", sa.Column("ip_address", sa.String(), nullable=True), schema="logging")
    op.add_column("api_calls", sa.Column("user_agent", sa.String(), nullable=True), schema="logging")


def downgrade() -> None:
    op.drop_column("api_calls", "user_agent", schema="logging")
    op.drop_column("api_calls", "ip_address", schema="logging")
