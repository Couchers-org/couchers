"""Add more email fields

Revision ID: 0062
Revises: 0061
Create Date: 2024-05-27 19:32:59.534093

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0062"
down_revision = "0061"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("emails", sa.Column("list_unsubscribe_header", sa.String(), nullable=True))
    op.add_column("emails", sa.Column("source_data", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("emails", "source_data")
    op.drop_column("emails", "list_unsubscribe_header")
