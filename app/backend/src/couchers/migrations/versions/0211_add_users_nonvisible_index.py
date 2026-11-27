"""Add a partial index on nonvisible users

Revision ID: 0211
Revises: 0210
"""

from alembic import op

revision = "0211"
down_revision = "0210"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_users_nonvisible",
        "users",
        ["id"],
        postgresql_include=["banned_at", "deleted_at", "shadowed_at"],
        postgresql_where="banned_at IS NOT NULL OR deleted_at IS NOT NULL OR shadowed_at IS NOT NULL",
    )


def downgrade() -> None:
    op.drop_index("ix_users_nonvisible", table_name="users")
