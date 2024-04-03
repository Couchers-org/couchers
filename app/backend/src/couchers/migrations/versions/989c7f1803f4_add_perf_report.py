"""Add perf report

Revision ID: 989c7f1803f4
Revises: 4023fed9a8db
Create Date: 2022-10-19 18:22:22.946598

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "989c7f1803f4"
down_revision = "4023fed9a8db"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("api_calls", sa.Column("perf_report", sa.String(), nullable=True), schema="logging")


def downgrade():
    op.drop_column("api_calls", "perf_report", schema="logging")
