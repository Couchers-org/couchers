"""Add source to donation initiations

Revision ID: 0112
Revises: 0111
Create Date: 2025-07-27 16:38:41.949812

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0112"
down_revision = "0111"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("donation_initiations", sa.Column("source", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("donation_initiations", "source")
