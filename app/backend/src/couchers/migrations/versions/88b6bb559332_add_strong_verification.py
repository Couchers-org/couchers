"""Add strong verification

Revision ID: 88b6bb559332
Revises: 69ce91d4db5e
Create Date: 2024-05-11 13:20:41.861077

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "88b6bb559332"
down_revision = "69ce91d4db5e"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "strong_verification_attempts",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("verification_attempt_token", sa.String(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "succeeded",
                "in_progress_waiting_on_user",
                "in_progress_waiting_on_backend",
                "failed",
                "deleted",
                name="strongverificationattemptstatus",
            ),
            nullable=False,
        ),
        sa.Column("has_full_data", sa.Boolean(), nullable=False),
        sa.Column("passport_encrypted_data", sa.LargeBinary(), nullable=True),
        sa.Column("passport_name", sa.String(), nullable=True),
        sa.Column("passport_date_of_birth", sa.Date(), nullable=True),
        sa.Column("passport_sex", sa.Enum("male", "female", "unspecified", name="passportsex"), nullable=True),
        sa.Column("has_minimal_data", sa.Boolean(), nullable=False),
        sa.Column("passport_expiry_date", sa.Date(), nullable=True),
        sa.Column("passport_nationality", sa.String(), nullable=True),
        sa.Column("passport_last_three_document_chars", sa.String(), nullable=True),
        sa.Column("iris_token", sa.String(), nullable=False),
        sa.Column("iris_session_id", sa.BigInteger(), nullable=False),
        sa.CheckConstraint(
            "(NOT ((status = 'in_progress_waiting_on_user') OR (status = 'in_progress_waiting_on_backend') OR (status = 'failed'))) OR (has_minimal_data IS FALSE)",
            name=op.f("ck_strong_verification_attempts_in_progress_failed_iris_implies_no_data"),
        ),
        sa.CheckConstraint(
            "(NOT (status = 'deleted')) OR (has_minimal_data IS TRUE)",
            name=op.f("ck_strong_verification_attempts_deleted_implies_minimal_data"),
        ),
        sa.CheckConstraint(
            "(NOT (status = 'succeeded')) OR (has_full_data IS TRUE)",
            name=op.f("ck_strong_verification_attempts_succeeded_implies_full_data"),
        ),
        sa.CheckConstraint(
            "(has_full_data IS FALSE) OR (has_minimal_data IS TRUE)",
            name=op.f("ck_strong_verification_attempts_full_data_implies_minimal_data"),
        ),
        sa.CheckConstraint(
            "(has_full_data IS TRUE AND passport_encrypted_data IS NOT NULL AND passport_name IS NOT NULL AND passport_date_of_birth IS NOT NULL) OR              (has_full_data IS FALSE AND passport_encrypted_data IS NULL AND passport_name IS NULL AND passport_date_of_birth IS NULL)",
            name=op.f("ck_strong_verification_attempts_full_data_status"),
        ),
        sa.CheckConstraint(
            "(has_minimal_data IS TRUE AND passport_expiry_date IS NOT NULL AND passport_nationality IS NOT NULL AND passport_last_three_document_chars IS NOT NULL) OR              (has_minimal_data IS FALSE AND passport_expiry_date IS NULL AND passport_nationality IS NULL AND passport_last_three_document_chars IS NULL)",
            name=op.f("ck_strong_verification_attempts_minimal_data_status"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_strong_verification_attempts_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_strong_verification_attempts")),
        sa.UniqueConstraint("iris_session_id", name=op.f("uq_strong_verification_attempts_iris_session_id")),
        sa.UniqueConstraint("iris_token", name=op.f("uq_strong_verification_attempts_iris_token")),
        sa.UniqueConstraint(
            "verification_attempt_token", name=op.f("uq_strong_verification_attempts_verification_attempt_token")
        ),
    )
    op.create_index(
        "ix_strong_verification_attempts_current",
        "strong_verification_attempts",
        ["user_id", "passport_expiry_date"],
        unique=False,
        postgresql_where=sa.text("status = 'succeeded'"),
    )
    op.create_index(
        "ix_strong_verification_attempts_unique_succeeded",
        "strong_verification_attempts",
        ["passport_expiry_date", "passport_nationality", "passport_last_three_document_chars"],
        unique=True,
        postgresql_where=sa.text("status = 'succeeded' OR status = 'deleted'"),
    )
    op.create_index(
        op.f("ix_strong_verification_attempts_user_id"), "strong_verification_attempts", ["user_id"], unique=False
    )
    op.create_table(
        "strong_verification_callback_events",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("verification_attempt_id", sa.BigInteger(), nullable=False),
        sa.Column("iris_status", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(
            ["verification_attempt_id"],
            ["strong_verification_attempts.id"],
            name=op.f("fk_strong_verification_callback_events_verification_attempt_id_strong_verification_attempts"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_strong_verification_callback_events")),
    )
    op.create_index(
        op.f("ix_strong_verification_callback_events_verification_attempt_id"),
        "strong_verification_callback_events",
        ["verification_attempt_id"],
        unique=False,
    )


def downgrade():
    op.drop_index(
        op.f("ix_strong_verification_callback_events_verification_attempt_id"),
        table_name="strong_verification_callback_events",
    )
    op.drop_table("strong_verification_callback_events")
    op.drop_index(op.f("ix_strong_verification_attempts_user_id"), table_name="strong_verification_attempts")
    op.drop_index(
        "ix_strong_verification_attempts_unique_succeeded",
        table_name="strong_verification_attempts",
        postgresql_where=sa.text("status = 'succeeded' OR status = 'deleted'"),
    )
    op.drop_index(
        "ix_strong_verification_attempts_current",
        table_name="strong_verification_attempts",
        postgresql_where=sa.text("status = 'succeeded'"),
    )
    op.drop_table("strong_verification_attempts")
