"""Add yearly donation type

Revision ID: 0190
Revises: 0189
Create Date: 2026-09-13 12:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0190"
down_revision = "0189"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE donationtype RENAME VALUE 'recurring' TO 'monthly'")
    op.execute("ALTER TYPE donationtype ADD VALUE 'yearly'")


def downgrade() -> None:
    raise Exception("Can't downgrade")
