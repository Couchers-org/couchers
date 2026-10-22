"""Index user_activity on sofa and on ip_address

Revision ID: 0185
Revises: 0184
Create Date: 2026-08-18 12:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0185"
down_revision = "0184"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.create_index(
            "ix_user_activity_sofa",
            "user_activity",
            ["sofa"],
            postgresql_concurrently=True,
            if_not_exists=True,
        )
        op.create_index(
            "ix_user_activity_ip_address",
            "user_activity",
            ["ip_address"],
            postgresql_concurrently=True,
            if_not_exists=True,
        )


def downgrade() -> None:
    with op.get_context().autocommit_block():
        op.drop_index(
            "ix_user_activity_ip_address",
            table_name="user_activity",
            postgresql_concurrently=True,
            if_exists=True,
        )
        op.drop_index(
            "ix_user_activity_sofa",
            table_name="user_activity",
            postgresql_concurrently=True,
            if_exists=True,
        )
