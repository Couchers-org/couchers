"""Add admin_note to users

Revision ID: 0055
Revises: 0054
Create Date: 2024-05-18 17:35:27.362898

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0055"
down_revision = "0054"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("admin_note", sa.String(), server_default=sa.text("''"), nullable=False))


def downgrade() -> None:
    op.drop_column("users", "admin_note")
