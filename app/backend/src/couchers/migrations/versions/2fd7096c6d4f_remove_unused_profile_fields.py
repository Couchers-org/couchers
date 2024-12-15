"""Remove unused profile fields

Revision ID: 2fd7096c6d4f
Revises: d3f2cb24b948
Create Date: 2024-11-25 15:24:12.393262

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "2fd7096c6d4f"
down_revision = "d3f2cb24b948"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column("users", "my_travels")
    op.drop_column("users", "full_name")


def downgrade():
    op.add_column("users", sa.Column("full_name", sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column("users", sa.Column("my_travels", sa.VARCHAR(), autoincrement=False, nullable=True))
