"""Add postal verification

Revision ID: d82ad0f2ac85
Revises: aa7270f6ddbe
Create Date: 2025-11-28 17:03:03.831956

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "d82ad0f2ac85"
down_revision = "aa7270f6ddbe"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'postal_verification__postcard_sent'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'postal_verification__success'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'postal_verification__failed'")

    op.create_table(
        "postal_verification_attempts",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "pending_address_confirmation",
                "in_progress",
                "awaiting_verification",
                "succeeded",
                "failed",
                "cancelled",
                name="postalverificationstatus",
            ),
            nullable=False,
        ),
        sa.Column("address_line_1", sa.String(), nullable=False),
        sa.Column("address_line_2", sa.String(), nullable=True),
        sa.Column("city", sa.String(), nullable=False),
        sa.Column("state", sa.String(), nullable=True),
        sa.Column("postal_code", sa.String(), nullable=True),
        sa.Column("country", sa.String(), nullable=False),
        sa.Column("original_address_json", sa.String(), nullable=True),
        sa.Column("verification_code", sa.String(), nullable=True),
        sa.Column("address_confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("postcard_sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("code_attempts", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.CheckConstraint(
            "(status != 'succeeded') OR (verified_at IS NOT NULL)",
            name=op.f("ck_postal_verification_attempts_postal_verification_verified_at_status"),
        ),
        sa.CheckConstraint(
            "(status IN ('pending_address_confirmation', 'cancelled') AND verification_code IS NULL) OR (status IN ('in_progress', 'awaiting_verification', 'succeeded', 'failed') AND verification_code IS NOT NULL)",
            name=op.f("ck_postal_verification_attempts_postal_verification_code_status"),
        ),
        sa.CheckConstraint(
            "(status NOT IN ('awaiting_verification', 'succeeded')) OR (postcard_sent_at IS NOT NULL)",
            name=op.f("ck_postal_verification_attempts_postal_verification_postcard_sent_status"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_postal_verification_attempts_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_postal_verification_attempts")),
    )
    op.create_index(
        "ix_postal_verification_attempts_current",
        "postal_verification_attempts",
        ["user_id"],
        unique=False,
        postgresql_where=sa.text("status = 'succeeded'"),
    )
    op.create_index(
        op.f("ix_postal_verification_attempts_user_id"), "postal_verification_attempts", ["user_id"], unique=False
    )
    op.create_index(
        "ix_postal_verification_one_active_per_user",
        "postal_verification_attempts",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text(
            "status = 'pending_address_confirmation' OR status = 'in_progress' OR status = 'awaiting_verification'"
        ),
    )


def downgrade() -> None:
    op.drop_index(
        "ix_postal_verification_one_active_per_user",
        table_name="postal_verification_attempts",
        postgresql_where=sa.text(
            "status = 'pending_address_confirmation' OR status = 'in_progress' OR status = 'awaiting_verification'"
        ),
    )
    op.drop_index(op.f("ix_postal_verification_attempts_user_id"), table_name="postal_verification_attempts")
    op.drop_index(
        "ix_postal_verification_attempts_current",
        table_name="postal_verification_attempts",
        postgresql_where=sa.text("status = 'succeeded'"),
    )
    op.drop_table("postal_verification_attempts")
    op.execute("DROP TYPE postalverificationstatus")
