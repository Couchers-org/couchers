"""Add ip and user agent

Revision ID: ca9d20814704
Revises: c7b0540a7b6b
Create Date: 2024-05-26 11:20:24.761107

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "ca9d20814704"
down_revision = "c7b0540a7b6b"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("api_calls", sa.Column("ip_address", sa.String(), nullable=True), schema="logging")
    op.add_column("api_calls", sa.Column("user_agent", sa.String(), nullable=True), schema="logging")


def downgrade():
    op.drop_column("api_calls", "user_agent", schema="logging")
    op.drop_column("api_calls", "ip_address", schema="logging")
