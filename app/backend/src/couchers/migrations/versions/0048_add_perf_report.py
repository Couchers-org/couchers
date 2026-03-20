"""Add perf report

Revision ID: 0048
Revises: 0047
Create Date: 2022-10-19 18:22:22.946598

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0048"
down_revision = "0047"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("api_calls", sa.Column("perf_report", sa.String(), nullable=True), schema="logging")


def downgrade() -> None:
    op.drop_column("api_calls", "perf_report", schema="logging")
