"""Add new index to lite users

Revision ID: 941b04198efe
Revises: f555ed35e4d0
Create Date: 2025-11-16 17:23:39.481479

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "941b04198efe"
down_revision = "f555ed35e4d0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE UNIQUE INDEX uq_lite_users_username ON lite_users(username);")


def downgrade() -> None:
    op.execute("DROP INDEX uq_lite_users_username;")
