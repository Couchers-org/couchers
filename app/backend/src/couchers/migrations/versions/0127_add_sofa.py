"""Add sofa

Revision ID: 0127
Revises: 0126
Create Date: 2026-01-31 23:57:48.581109

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0127"
down_revision = "0126"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("api_calls", sa.Column("sofa", sa.String(), nullable=True), schema="logging")


def downgrade() -> None:
    op.drop_column("api_calls", "sofa", schema="logging")
