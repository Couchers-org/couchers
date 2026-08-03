"""Drop the try count expression from the background jobs lookup index

Revision ID: 0178
Revises: 0177
Create Date: 2026-08-02 10:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0178"
down_revision = "0177"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # created under a new name so it can be built by hand ahead of the deploy without this migration then dropping
    # and rebuilding it
    with op.get_context().autocommit_block():
        op.create_index(
            "ix_background_jobs_priority_next_attempt_after_unfinished",
            "background_jobs",
            [sa.text("priority DESC"), "next_attempt_after"],
            postgresql_where="state = 'pending' OR state = 'error'",
            postgresql_concurrently=True,
            if_not_exists=True,
        )
        op.drop_index(
            "ix_background_jobs_lookup",
            table_name="background_jobs",
            postgresql_concurrently=True,
            if_exists=True,
        )


def downgrade() -> None:
    with op.get_context().autocommit_block():
        op.create_index(
            "ix_background_jobs_lookup",
            "background_jobs",
            [sa.text("priority DESC"), "next_attempt_after", sa.text("(max_tries - try_count)")],
            postgresql_where="state = 'pending' OR state = 'error'",
            postgresql_concurrently=True,
            if_not_exists=True,
        )
        op.drop_index(
            "ix_background_jobs_priority_next_attempt_after_unfinished",
            table_name="background_jobs",
            postgresql_concurrently=True,
            if_exists=True,
        )
