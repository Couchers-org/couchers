"""Add volunteer overrides

Revision ID: 0105
Revises: 0104
Create Date: 2025-07-26 17:50:41.676528

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0105"
down_revision = "0104"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("volunteers", sa.Column("display_name", sa.String(), nullable=True))
    op.add_column("volunteers", sa.Column("display_location", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("volunteers", "display_location")
    op.drop_column("volunteers", "display_name")
