"""Unique (platform, manifest_id) on ota_packages

Revision ID: 0163
Revises: 0162
Create Date: 2026-06-02 12:00:00.000000

"""

from alembic import op

revision = "0163"
down_revision = "0162"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop pre-fix rows so the constraint can apply on staging where ids repeated; the next publish refills.
    op.execute("TRUNCATE TABLE ota_packages")
    op.create_unique_constraint(
        "uq_ota_packages_platform_manifest_id",
        "ota_packages",
        ["platform", "manifest_id"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_ota_packages_platform_manifest_id", "ota_packages", type_="unique")
