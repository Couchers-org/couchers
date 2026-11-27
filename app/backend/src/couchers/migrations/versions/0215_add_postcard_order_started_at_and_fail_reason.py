"""Add postcard_order_started_at and fail_reason to postal verification attempts

Revision ID: 0215
Revises: 0214
"""

import sqlalchemy as sa
from alembic import op

revision = "0215"
down_revision = "0214"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "postal_verification_attempts",
        sa.Column("postcard_order_started_at", sa.DateTime(timezone=True), nullable=True),
    )
    # Attempts already in sending were claimed by a job just after their address was confirmed
    op.execute(
        "UPDATE postal_verification_attempts SET postcard_order_started_at = address_confirmed_at "
        "WHERE status = 'sending'"
    )
    op.create_check_constraint(
        op.f("ck_postal_verification_attempts_postal_verification_order_started_status"),
        "postal_verification_attempts",
        "(status != 'sending') OR (postcard_order_started_at IS NOT NULL)",
    )
    fail_reason = sa.Enum("code_expired", "too_many_attempts", "address_rejected", name="postalverificationfailreason")
    fail_reason.create(op.get_bind())
    op.add_column("postal_verification_attempts", sa.Column("fail_reason", fail_reason, nullable=True))


def downgrade() -> None:
    op.drop_column("postal_verification_attempts", "fail_reason")
    sa.Enum(name="postalverificationfailreason").drop(op.get_bind())
    op.drop_constraint(
        op.f("ck_postal_verification_attempts_postal_verification_order_started_status"),
        "postal_verification_attempts",
        type_="check",
    )
    op.drop_column("postal_verification_attempts", "postcard_order_started_at")
