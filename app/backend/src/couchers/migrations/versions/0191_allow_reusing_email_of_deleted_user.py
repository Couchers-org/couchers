"""Allow reusing the email of a deleted user

Revision ID: 0191
Revises: 0190
Create Date: 2026-09-22 12:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0191"
down_revision = "0190"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.create_index(
            "ix_users_unique_email",
            "users",
            ["email"],
            unique=True,
            postgresql_where="deleted_at IS NULL",
            postgresql_concurrently=True,
            if_not_exists=True,
        )
        op.create_index(
            "ix_users_email",
            "users",
            ["email"],
            postgresql_concurrently=True,
            if_not_exists=True,
        )
    op.drop_constraint("uq_users_email", "users", type_="unique")


def downgrade() -> None:
    op.create_unique_constraint("uq_users_email", "users", ["email"])
    with op.get_context().autocommit_block():
        op.drop_index("ix_users_email", table_name="users", postgresql_concurrently=True, if_exists=True)
        op.drop_index("ix_users_unique_email", table_name="users", postgresql_concurrently=True, if_exists=True)
