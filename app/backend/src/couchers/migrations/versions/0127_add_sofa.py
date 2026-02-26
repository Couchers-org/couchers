"""Add sofa

Revision ID: f016e6defa9d
Revises: 6862ecf6494d
Create Date: 2026-01-31 23:57:48.581109

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "f016e6defa9d"
down_revision = "6862ecf6494d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("api_calls", sa.Column("sofa", sa.String(), nullable=True), schema="logging")


def downgrade() -> None:
    op.drop_column("api_calls", "sofa", schema="logging")
