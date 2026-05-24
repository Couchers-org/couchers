"""Backend: add experimental_features_enabled and is_volunteer to experiment evaluator

Revision ID: 0158
Revises: 0157
Create Date: 2026-05-24 18:41:23.257685

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0158"
down_revision = "0157"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("enable_experimental_features", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("users", "enable_experimental_features")
