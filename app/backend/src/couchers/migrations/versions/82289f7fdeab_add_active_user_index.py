"""Add active user index

Revision ID: 82289f7fdeab
Revises: 13fe6ada1535
Create Date: 2022-02-14 13:23:42.185952

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "82289f7fdeab"
down_revision = "13fe6ada1535"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index(
        "ix_users_active", "users", ["id"], unique=False, postgresql_where=sa.text("NOT is_banned AND NOT is_deleted")
    )


def downgrade():
    op.drop_index("ix_users_active", table_name="users", postgresql_where=sa.text("NOT is_banned AND NOT is_deleted"))
