"""Remove unused profile fields

Revision ID: 0077
Revises: 0076
Create Date: 2024-11-25 15:24:12.393262

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0077"
down_revision = "0076"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("users", "my_travels")
    op.drop_column("users", "full_name")


def downgrade() -> None:
    op.add_column("users", sa.Column("full_name", sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column("users", sa.Column("my_travels", sa.VARCHAR(), autoincrement=False, nullable=True))
