"""Drop the try count expression from the background jobs lookup index

Revision ID: 0177
Revises: 0176
Create Date: 2026-08-02 10:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0177"
down_revision = "0176"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_index("ix_background_jobs_lookup", table_name="background_jobs")
    op.create_index(
        "ix_background_jobs_lookup",
        "background_jobs",
        [sa.text("priority DESC"), "next_attempt_after"],
        unique=False,
        postgresql_where=sa.text("state = 'pending' OR state = 'error'"),
    )


def downgrade() -> None:
    op.drop_index("ix_background_jobs_lookup", table_name="background_jobs")
    op.create_index(
        "ix_background_jobs_lookup",
        "background_jobs",
        [sa.text("priority DESC"), "next_attempt_after", sa.text("(max_tries - try_count)")],
        unique=False,
        postgresql_where=sa.text("state = 'pending' OR state = 'error'"),
    )
