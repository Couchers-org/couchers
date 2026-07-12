"""Add trace to AdminActionLevel

Revision ID: 0169
Revises: 0168
Create Date: 2026-06-20 00:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0169"
down_revision = "0168"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 'trace' sorts below 'debug' so the enum's intrinsic ordering matches its severity
    op.execute("ALTER TYPE adminactionlevel ADD VALUE IF NOT EXISTS 'trace' BEFORE 'debug'")


def downgrade() -> None:
    # PostgreSQL cannot drop a value from an enum type, so this is a no-op.
    pass
