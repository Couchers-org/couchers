"""Add user email history table and relax email uniqueness

Revision ID: 0141
Revises: 0140
Create Date: 2026-03-28 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0141"
down_revision = "0140"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create the user_email_history table
    op.create_table(
        "user_email_history",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.BigInteger(), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("set_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("removed_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Populate email history from existing users
    op.execute(
        """
        INSERT INTO user_email_history (user_id, email, set_at)
        SELECT id, email, joined
        FROM users
        """
    )

    # Drop the old unique constraint on users.email
    op.drop_constraint("uq_users_email", "users", type_="unique")

    # Add a partial unique index: email must be unique among active (non-deleted, non-banned) users
    op.create_index(
        "ix_users_unique_email_active",
        "users",
        ["email"],
        unique=True,
        postgresql_where=sa.text("banned_at IS NULL AND deleted_at IS NULL"),
    )


def downgrade() -> None:
    op.drop_index("ix_users_unique_email_active", table_name="users")
    op.create_unique_constraint("uq_users_email", "users", ["email"])
    op.drop_table("user_email_history")
