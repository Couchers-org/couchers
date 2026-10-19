"""Public trip offers: the traveller confirms or cancels, the host withdraws by rejecting

Revision ID: 0196
Revises: 0195
Create Date: 2026-10-18 12:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0196"
down_revision = "0195"
branch_labels = None
depends_on = None


def rebuild_active_offer_index(withdrawn_status: str) -> None:
    with op.get_context().autocommit_block():
        # a failed concurrent build leaves an invalid index behind, so drop it to rebuild on retry
        op.execute("DROP INDEX CONCURRENTLY IF EXISTS ix_host_requests_one_active_offer_per_trip")
        op.create_index(
            "ix_host_requests_one_active_offer_per_trip",
            "host_requests",
            ["public_trip_id", "initiator_user_id"],
            unique=True,
            postgresql_where=f"public_trip_id IS NOT NULL AND status != '{withdrawn_status}'",
            postgresql_concurrently=True,
        )


def swap_offer_control_messages() -> None:
    # so the history in existing offer threads still reads as who withdrew and who declined
    op.execute(
        """
        UPDATE messages SET host_request_status_target = CASE host_request_status_target
            WHEN 'cancelled' THEN 'rejected'::hostrequeststatus
            WHEN 'rejected' THEN 'cancelled'::hostrequeststatus
        END
        WHERE conversation_id IN (SELECT id FROM host_requests WHERE public_trip_id IS NOT NULL)
          AND host_request_status_target IN ('cancelled', 'rejected')
        """
    )


def upgrade() -> None:
    # the old index would reject the remapped statuses midway, so drop it first
    with op.get_context().autocommit_block():
        op.execute("DROP INDEX CONCURRENTLY IF EXISTS ix_host_requests_one_active_offer_per_trip")
    # previously the host withdrew by cancelling, the traveller declined by rejecting, and the traveller accepting
    # still needed the host to confirm
    op.execute(
        """
        UPDATE host_requests SET status = CASE status
            WHEN 'cancelled' THEN 'rejected'::hostrequeststatus
            WHEN 'rejected' THEN 'cancelled'::hostrequeststatus
            WHEN 'accepted' THEN 'confirmed'::hostrequeststatus
        END
        WHERE public_trip_id IS NOT NULL AND status IN ('cancelled', 'rejected', 'accepted')
        """
    )
    swap_offer_control_messages()
    rebuild_active_offer_index("rejected")


def downgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("DROP INDEX CONCURRENTLY IF EXISTS ix_host_requests_one_active_offer_per_trip")
    op.execute(
        """
        UPDATE host_requests SET status = CASE status
            WHEN 'rejected' THEN 'cancelled'::hostrequeststatus
            WHEN 'cancelled' THEN 'rejected'::hostrequeststatus
        END
        WHERE public_trip_id IS NOT NULL AND status IN ('cancelled', 'rejected')
        """
    )
    swap_offer_control_messages()
    rebuild_active_offer_index("cancelled")
