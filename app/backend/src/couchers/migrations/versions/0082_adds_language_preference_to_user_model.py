"""Adds language preference to User model

Revision ID: 0082
Revises: 0081
Create Date: 2025-02-20 12:56:31.224874

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0082"
down_revision = "0081"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("ui_language_preference", sa.String(), server_default="", nullable=True))


def downgrade() -> None:
    op.drop_column("users", "ui_language_preference")
