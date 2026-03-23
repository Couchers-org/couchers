"""Add contributor form time created

Revision ID: 0026
Revises: 0025
Create Date: 2021-07-23 13:14:54.695201

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0026"
down_revision = "0025"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "contributor_forms",
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("contributor_forms", "created")
