"""Add bulk_set_visibility to moderationaction enum

Revision ID: 0144
Revises: 0143
Create Date: 2026-04-19 12:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0144"
down_revision = "0143"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ALTER TYPE ... ADD VALUE cannot run inside a transaction in PostgreSQL
    op.execute("COMMIT")
    op.execute("ALTER TYPE moderationaction ADD VALUE IF NOT EXISTS 'bulk_set_visibility'")


def downgrade() -> None:
    raise Exception("Can't downgrade")
