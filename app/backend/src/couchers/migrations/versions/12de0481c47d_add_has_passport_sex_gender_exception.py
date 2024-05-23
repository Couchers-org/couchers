"""Add has_passport_sex_gender_exception

Revision ID: 12de0481c47d
Revises: 88b6bb559332
Create Date: 2024-05-15 18:16:01.620243

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "12de0481c47d"
down_revision = "88b6bb559332"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column("has_passport_sex_gender_exception", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )


def downgrade():
    op.drop_column("users", "has_passport_sex_gender_exception")
