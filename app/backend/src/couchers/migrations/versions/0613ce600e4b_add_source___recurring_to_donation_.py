"""add_source_&_recurring_to_donation_initiations

Revision ID: 0613ce600e4b
Revises: c29307a66e4b
Create Date: 2025-07-27 16:38:41.949812

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0613ce600e4b"
down_revision = "888ec31ad793"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("donation_initiations", sa.Column("source", sa.String(), nullable=True))


def downgrade():
    op.drop_column("donation_initiations", "source")
