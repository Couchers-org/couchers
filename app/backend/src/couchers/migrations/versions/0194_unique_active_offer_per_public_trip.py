"""Allow at most one non-withdrawn offer per host per public trip

Revision ID: 0194
Revises: 0193
Create Date: 2026-10-08 12:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0194"
down_revision = "0193"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.create_index(
            "ix_host_requests_one_active_offer_per_trip",
            "host_requests",
            ["public_trip_id", "initiator_user_id"],
            unique=True,
            postgresql_where="status != 'cancelled'",
            postgresql_concurrently=True,
            if_not_exists=True,
        )


def downgrade() -> None:
    with op.get_context().autocommit_block():
        op.drop_index(
            "ix_host_requests_one_active_offer_per_trip",
            table_name="host_requests",
            postgresql_concurrently=True,
            if_exists=True,
        )
