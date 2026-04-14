"""Add num_travelers to public_trips

Revision ID: 0143
Revises: 0142
Create Date: 2026-04-14 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0143"
down_revision = "0142"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("public_trips", sa.Column("num_travelers", sa.Integer(), nullable=False, server_default="1"))


def downgrade() -> None:
    op.drop_column("public_trips", "num_travelers")
