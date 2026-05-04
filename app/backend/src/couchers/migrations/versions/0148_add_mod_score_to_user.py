"""Add mod_score to User

Revision ID: 0148
Revises: 0147
Create Date: 2026-05-04 00:08:01.795622

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0148"
down_revision = "0147"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("mod_score", sa.Float(), server_default="1", nullable=False))


def downgrade() -> None:
    op.drop_column("users", "mod_score")
