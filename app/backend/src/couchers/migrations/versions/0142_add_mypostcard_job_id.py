"""Add mypostcard_job_id and rename country to country_code in postal_verification_attempts

Revision ID: 0142
Revises: 0141
Create Date: 2026-03-18 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0142"
down_revision = "0141"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("postal_verification_attempts", sa.Column("mypostcard_job_id", sa.Integer(), nullable=True))
    op.alter_column("postal_verification_attempts", "country", new_column_name="country_code")


def downgrade() -> None:
    op.alter_column("postal_verification_attempts", "country_code", new_column_name="country")
    op.drop_column("postal_verification_attempts", "mypostcard_job_id")
