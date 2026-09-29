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
    # until now only the recipient could decline and only the initiator could cancel
    op.execute("UPDATE host_requests SET ended_by_user_id = recipient_user_id WHERE status = 'rejected'")
    op.execute("UPDATE host_requests SET ended_by_user_id = initiator_user_id WHERE status = 'cancelled'")
    op.create_check_constraint(
        op.f("ck_host_requests_ended_by_only_when_ended"),
        "host_requests",
        "ended_by_user_id IS NULL OR status IN ('rejected', 'cancelled')",
    )


def downgrade() -> None:
    op.drop_constraint(op.f("ck_host_requests_ended_by_only_when_ended"), "host_requests", type_="check")
    op.drop_constraint(op.f("fk_host_requests_ended_by_user_id_users"), "host_requests", type_="foreignkey")
    op.drop_column("host_requests", "ended_by_user_id")
