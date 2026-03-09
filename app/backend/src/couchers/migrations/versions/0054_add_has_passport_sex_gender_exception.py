"""Add has_passport_sex_gender_exception

Revision ID: 0054
Revises: 0053
Create Date: 2024-05-15 18:16:01.620243

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0054"
down_revision = "0053"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("has_passport_sex_gender_exception", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("users", "has_passport_sex_gender_exception")
