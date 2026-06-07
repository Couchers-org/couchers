"""Add last_updated field to PhotoGallery

Revision ID: 0150
Revises: 0149
Create Date: 2026-05-11 04:29:37.805098

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0150"
down_revision = "0149"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "photo_galleries",
        sa.Column("last_updated", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("photo_galleries", "last_updated")
