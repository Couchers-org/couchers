"""Add event timezone column

Revision ID: 0170
Revises: 0169
Create Date: 2026-07-02 13:47:21.368662

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0170"
down_revision = "0169"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("event_occurrences", sa.Column("timezone", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("event_occurrences", "timezone")
