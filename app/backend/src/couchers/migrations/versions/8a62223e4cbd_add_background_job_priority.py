"""Add background job priority

Revision ID: 8a62223e4cbd
Revises: ff3ee8951d1b
Create Date: 2025-03-19 15:20:00.911552

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "8a62223e4cbd"
down_revision = "ff3ee8951d1b"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("background_jobs", sa.Column("priority", sa.Integer(), server_default=sa.text("10"), nullable=False))
    op.drop_index(
        "ix_background_jobs_lookup",
        table_name="background_jobs",
        postgresql_where="((state = 'pending'::backgroundjobstate) OR (state = 'error'::backgroundjobstate))",
    )
    op.create_index(
        "ix_background_jobs_lookup",
        "background_jobs",
        [sa.text("priority DESC"), "next_attempt_after", sa.text("(max_tries - try_count)")],
        unique=False,
        postgresql_where=sa.text("state = 'pending' OR state = 'error'"),
    )
