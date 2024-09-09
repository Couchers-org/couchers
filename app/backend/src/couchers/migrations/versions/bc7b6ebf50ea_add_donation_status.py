"""Add donation status

Revision ID: bc7b6ebf50ea
Revises: 3ac39dcf3b5a
Create Date: 2024-07-17 09:46:20.672556

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "bc7b6ebf50ea"
down_revision = "3ac39dcf3b5a"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("has_donated", sa.Boolean(), server_default=sa.text("false"), nullable=False))
    op.execute("UPDATE USERS SET has_donated = true WHERE id IN (SELECT user_id FROM invoices)")


def downgrade():
    op.drop_column("users", "has_donated")
