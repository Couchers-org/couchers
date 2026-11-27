"""Index user_activity on period

Revision ID: 0214
Revises: 0213
"""

from alembic import op

revision = "0214"
down_revision = "0213"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.create_index(
            "ix_user_activity_period",
            "user_activity",
            ["period"],
            postgresql_concurrently=True,
            if_not_exists=True,
        )


def downgrade() -> None:
    with op.get_context().autocommit_block():
        op.drop_index(
            "ix_user_activity_period",
            table_name="user_activity",
            postgresql_concurrently=True,
            if_exists=True,
        )
