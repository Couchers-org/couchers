"""Add a sending status to postal verification attempts

Revision ID: 0213
Revises: 0212
"""

import sqlalchemy as sa
from alembic import op

revision = "0213"
down_revision = "0212"
branch_labels = None
depends_on = None


def _code_status_check(code_statuses: str) -> str:
    return (
        "(status IN ('pending_address_confirmation', 'cancelled') AND verification_code IS NULL) OR "
        f"(status IN ({code_statuses}) AND verification_code IS NOT NULL)"
    )


def _create_one_active_index(active_statuses: str) -> None:
    op.create_index(
        "ix_postal_verification_one_active_per_user",
        "postal_verification_attempts",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text(active_statuses),
    )


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE postalverificationstatus ADD VALUE IF NOT EXISTS 'sending' AFTER 'in_progress'")

    op.drop_constraint(
        op.f("ck_postal_verification_attempts_postal_verification_code_status"),
        "postal_verification_attempts",
        type_="check",
    )
    op.create_check_constraint(
        op.f("ck_postal_verification_attempts_postal_verification_code_status"),
        "postal_verification_attempts",
        _code_status_check("'in_progress', 'sending', 'awaiting_verification', 'succeeded', 'failed'"),
    )
    op.drop_index("ix_postal_verification_one_active_per_user", table_name="postal_verification_attempts")
    _create_one_active_index(
        "status = 'pending_address_confirmation' OR status = 'in_progress' OR status = 'sending' "
        "OR status = 'awaiting_verification'"
    )


def downgrade() -> None:
    op.execute("UPDATE postal_verification_attempts SET status = 'in_progress' WHERE status = 'sending'")

    for name in ["verified_at_status", "postcard_sent_status", "code_status"]:
        op.drop_constraint(
            op.f(f"ck_postal_verification_attempts_postal_verification_{name}"),
            "postal_verification_attempts",
            type_="check",
        )
    op.drop_index("ix_postal_verification_attempts_current", table_name="postal_verification_attempts")
    op.drop_index("ix_postal_verification_one_active_per_user", table_name="postal_verification_attempts")

    op.execute("ALTER TYPE postalverificationstatus RENAME TO postalverificationstatus_old")
    op.execute(
        "CREATE TYPE postalverificationstatus AS ENUM "
        "('pending_address_confirmation', 'in_progress', 'awaiting_verification', 'succeeded', 'failed', 'cancelled')"
    )
    op.execute(
        "ALTER TABLE postal_verification_attempts ALTER COLUMN status TYPE postalverificationstatus "
        "USING status::text::postalverificationstatus"
    )
    op.execute("DROP TYPE postalverificationstatus_old")

    op.create_check_constraint(
        op.f("ck_postal_verification_attempts_postal_verification_verified_at_status"),
        "postal_verification_attempts",
        "(status != 'succeeded') OR (verified_at IS NOT NULL)",
    )
    op.create_check_constraint(
        op.f("ck_postal_verification_attempts_postal_verification_postcard_sent_status"),
        "postal_verification_attempts",
        "(status NOT IN ('awaiting_verification', 'succeeded')) OR (postcard_sent_at IS NOT NULL)",
    )
    op.create_check_constraint(
        op.f("ck_postal_verification_attempts_postal_verification_code_status"),
        "postal_verification_attempts",
        _code_status_check("'in_progress', 'awaiting_verification', 'succeeded', 'failed'"),
    )
    op.create_index(
        "ix_postal_verification_attempts_current",
        "postal_verification_attempts",
        ["user_id"],
        postgresql_where=sa.text("status = 'succeeded'"),
    )
    _create_one_active_index(
        "status = 'pending_address_confirmation' OR status = 'in_progress' OR status = 'awaiting_verification'"
    )
