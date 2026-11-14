"""Add users.has_opted_in_to_beta_features for opting in to feature previews

Revision ID: 0201
Revises: 0200
Create Date: 2026-11-14 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0201"
down_revision = "0200"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users", sa.Column("has_opted_in_to_beta_features", sa.Boolean(), nullable=False, server_default=sa.false())
    )


def downgrade() -> None:
    op.drop_column("users", "has_opted_in_to_beta_features")
