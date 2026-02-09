"""Devops/auto format action

Revision ID: ce345bd05d5b
Revises: 738c3c9f922e
Create Date: 2026-02-09 03:38:35.580698

"""

from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "ce345bd05d5b"
down_revision = "738c3c9f922e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("users", "hashed_password", existing_type=postgresql.BYTEA(), nullable=True)


def downgrade() -> None:
    op.alter_column("users", "hashed_password", existing_type=postgresql.BYTEA(), nullable=False)
