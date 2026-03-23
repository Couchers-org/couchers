"""Add index on background jobs

Revision ID: 0041
Revises: 0040
Create Date: 2022-02-10 16:45:08.181199

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0041"
down_revision = "0040"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_background_jobs_state_next_attempt_after", "background_jobs", ["state", "next_attempt_after"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_background_jobs_state_next_attempt_after", table_name="background_jobs")
