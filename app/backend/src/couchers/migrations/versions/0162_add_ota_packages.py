"""Add ota_packages table

Revision ID: 0162
Revises: 0161
Create Date: 2026-05-31 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0162"
down_revision = "0161"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ota_packages",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("creator_user_id", sa.BigInteger(), nullable=False),
        sa.Column("platform", sa.Enum("ios", "android", name="otaplatform"), nullable=False),
        sa.Column("fingerprint", sa.String(), nullable=False),
        sa.Column("version", sa.String(), nullable=False),
        sa.Column("manifest_created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("manifest_id", sa.String(), nullable=False),
        sa.Column("banned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("banned_by_user_id", sa.BigInteger(), nullable=True),
        sa.Column("banned_reason", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["creator_user_id"], ["users.id"], name=op.f("fk_ota_packages_creator_user_id_users")),
        sa.ForeignKeyConstraint(
            ["banned_by_user_id"], ["users.id"], name=op.f("fk_ota_packages_banned_by_user_id_users")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_ota_packages")),
        sa.UniqueConstraint("platform", "version", name="uq_ota_packages_platform_version"),
        sa.CheckConstraint(
            "(banned_at IS NULL AND banned_by_user_id IS NULL AND banned_reason IS NULL) "
            "OR (banned_at IS NOT NULL AND banned_by_user_id IS NOT NULL AND banned_reason IS NOT NULL)",
            name="ck_ota_packages_ban_columns_consistent",
        ),
    )
    op.create_index(op.f("ix_ota_packages_creator_user_id"), "ota_packages", ["creator_user_id"])
    op.create_index("ix_ota_packages_resolve", "ota_packages", ["platform", "fingerprint", "manifest_created_at"])


def downgrade() -> None:
    op.drop_table("ota_packages")
    sa.Enum(name="otaplatform").drop(op.get_bind())
