"""Add postcard_order_started_at and fail_reason to postal verification attempts

Revision ID: 0202
Revises: 0201
"""

import sqlalchemy as sa
from alembic import op

revision = "0202"
down_revision = "0201"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "postal_verification_attempts",
        sa.Column("postcard_order_started_at", sa.DateTime(timezone=True), nullable=True),
    )
    fail_reason = sa.Enum("code_expired", "too_many_attempts", "address_rejected", name="postalverificationfailreason")
    fail_reason.create(op.get_bind())
    op.add_column("postal_verification_attempts", sa.Column("fail_reason", fail_reason, nullable=True))


def downgrade() -> None:
    op.drop_column("postal_verification_attempts", "fail_reason")
    sa.Enum(name="postalverificationfailreason").drop(op.get_bind())
    op.drop_column("postal_verification_attempts", "postcard_order_started_at")
