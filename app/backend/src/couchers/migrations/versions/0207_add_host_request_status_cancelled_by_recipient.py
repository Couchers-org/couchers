"""Add the cancelled_by_recipient host request status

Revision ID: 0207
Revises: 0206
"""

from alembic import op

revision = "0207"
down_revision = "0206"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE hostrequeststatus ADD VALUE 'cancelled_by_recipient'")


def downgrade() -> None:
    raise Exception("Can't downgrade")
