"""add_superuser_column

Revision ID: 1c7784767710
Revises: bf12729fa8eb
Create Date: 2021-06-16 15:20:23.475561

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "1c7784767710"
down_revision = "bf12729fa8eb"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("is_superuser", sa.Boolean(), server_default="false", nullable=False))


def downgrade():
    op.drop_column("users", "is_superuser")
