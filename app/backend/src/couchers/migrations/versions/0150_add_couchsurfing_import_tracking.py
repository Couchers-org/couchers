"""Add CouchSurfing import tracking

Revision ID: 0150
Revises: 0149
Create Date: 2026-03-28 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0150"
down_revision = "0149"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "couchsurfingcom_import_attempts",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("success", sa.Boolean(), nullable=False),
        sa.Column("raw_json", sa.String(), nullable=False),
        sa.Column("old_values", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("new_values", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("warnings", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("errors", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_couchsurfingcom_import_attempts_user_id_users")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_couchsurfingcom_import_attempts")),
    )
    op.create_index(
        "ix_couchsurfingcom_import_attempts_created",
        "couchsurfingcom_import_attempts",
        ["created"],
        unique=False,
    )
    op.create_index(
        "ix_couchsurfingcom_import_attempts_user_id",
        "couchsurfingcom_import_attempts",
        ["user_id"],
        unique=False,
    )
    op.add_column(
        "users", sa.Column("has_imported_from_couchsurfing_com", sa.Boolean(), server_default="false", nullable=False)
    )


def downgrade() -> None:
    op.drop_column("users", "has_imported_from_couchsurfing_com")
    op.drop_index("ix_couchsurfingcom_import_attempts_user_id", table_name="couchsurfingcom_import_attempts")
    op.drop_index("ix_couchsurfingcom_import_attempts_created", table_name="couchsurfingcom_import_attempts")
    op.drop_table("couchsurfingcom_import_attempts")
