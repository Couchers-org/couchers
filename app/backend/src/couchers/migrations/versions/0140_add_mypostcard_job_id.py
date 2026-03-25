"""Add mypostcard_job_id to postal_verification_attempts

Revision ID: 0140
Revises: 0139
Create Date: 2026-03-18 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0140"
down_revision = "0139"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("postal_verification_attempts", sa.Column("mypostcard_job_id", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("postal_verification_attempts", "mypostcard_job_id")
