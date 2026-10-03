"""Add host request timezone column

Revision ID: 0193
Revises: 0192
Create Date: 2026-09-29 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0193"
down_revision = "0192"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("host_requests", sa.Column("timezone", sa.String(), nullable=True))

    # We previously used Etc/UTC regardless of host's timezones,
    # and didn't record their timezone at the time of host request creation.
    # We can't use their current timezone as they could have moved since then.
    op.execute("UPDATE host_requests SET timezone = 'Etc/UTC'")

    op.alter_column("host_requests", "timezone", nullable=False)


def downgrade() -> None:
    op.drop_column("host_requests", "timezone")
