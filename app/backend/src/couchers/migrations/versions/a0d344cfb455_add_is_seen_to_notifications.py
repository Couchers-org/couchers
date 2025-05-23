"""Add is_seen to notifications

Revision ID: a0d344cfb455
Revises: b16903ba2c18
Create Date: 2025-04-17 08:29:25.303011

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a0d344cfb455"
down_revision = "b16903ba2c18"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("notifications", sa.Column("is_seen", sa.Boolean(), server_default=sa.text("false"), nullable=False))


def downgrade():
    op.drop_column("notifications", "is_seen")
