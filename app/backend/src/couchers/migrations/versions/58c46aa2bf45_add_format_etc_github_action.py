"""Add format etc github action

Revision ID: 58c46aa2bf45
Revises: 738c3c9f922e
Create Date: 2026-02-09 03:25:46.690996

"""

from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "58c46aa2bf45"
down_revision = "738c3c9f922e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("users", "hashed_password", existing_type=postgresql.BYTEA(), nullable=True)


def downgrade() -> None:
    op.alter_column("users", "hashed_password", existing_type=postgresql.BYTEA(), nullable=False)
