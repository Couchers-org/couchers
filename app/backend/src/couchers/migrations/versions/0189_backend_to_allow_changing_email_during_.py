"""Backend to allow changing email during signup

Revision ID: 0189
Revises: 0188
Create Date: 2026-09-12 15:53:44.262937

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0189"
down_revision = "0188"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("signup_flows", sa.Column("email_changed_count", sa.Integer(), server_default="0", nullable=False))


def downgrade() -> None:
    op.drop_column("signup_flows", "email_changed_count")
