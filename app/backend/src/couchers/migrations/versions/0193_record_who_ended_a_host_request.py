"""Record who ended a host request

Revision ID: 0193
Revises: 0192
Create Date: 2026-09-29 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0193"
down_revision = "0192"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("host_requests", sa.Column("ended_by_user_id", sa.BigInteger(), nullable=True))
    op.create_foreign_key(
        op.f("fk_host_requests_ended_by_user_id_users"), "host_requests", "users", ["ended_by_user_id"], ["id"]
    )
    # backfill from the author of the status change that ended each request
    op.execute(
        """
        UPDATE host_requests
        SET ended_by_user_id = (
            SELECT messages.author_id
            FROM messages
            WHERE messages.conversation_id = host_requests.id
              AND messages.message_type = 'host_request_status_changed'
              AND messages.host_request_status_target = host_requests.status
            ORDER BY messages.id DESC
            LIMIT 1
        )
        WHERE host_requests.status IN ('rejected', 'cancelled')
        """
    )
    op.create_check_constraint(
        op.f("ck_host_requests_ended_by_only_when_ended"),
        "host_requests",
        "ended_by_user_id IS NULL OR status IN ('rejected', 'cancelled')",
    )


def downgrade() -> None:
    op.drop_constraint(op.f("ck_host_requests_ended_by_only_when_ended"), "host_requests", type_="check")
    op.drop_constraint(op.f("fk_host_requests_ended_by_user_id_users"), "host_requests", type_="foreignkey")
    op.drop_column("host_requests", "ended_by_user_id")
