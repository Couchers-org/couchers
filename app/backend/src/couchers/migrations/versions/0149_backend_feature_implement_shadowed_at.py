"""Backend/feature: Implement shadowed_at

Revision ID: 0149
Revises: 0148
Create Date: 2026-05-10 00:57:25.840767

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0149"
down_revision = "0148"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("shadowed_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "shadowed_at")
