"""Adds language preference to User model

Revision ID: 9b738767992c
Revises: 99aece5bdc42
Create Date: 2025-02-20 12:56:31.224874

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "9b738767992c"
down_revision = "99aece5bdc42"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("ui_language_preference", sa.String(), server_default="", nullable=True))


def downgrade():
    op.drop_column("users", "ui_language_preference")
