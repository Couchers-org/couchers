"""Add new index to lite users

Revision ID: 0116
Revises: 0115
Create Date: 2025-11-16 17:23:39.481479

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0116"
down_revision = "0115"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE UNIQUE INDEX uq_lite_users_username ON lite_users(username);")


def downgrade() -> None:
    op.execute("DROP INDEX uq_lite_users_username;")
