"""Add more email fields

Revision ID: 3b63c4706f0d
Revises: 2c084379cb84
Create Date: 2024-05-27 19:32:59.534093

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "3b63c4706f0d"
down_revision = "2c084379cb84"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("emails", sa.Column("list_unsubscribe_header", sa.String(), nullable=True))
    op.add_column("emails", sa.Column("source_data", sa.String(), nullable=True))


def downgrade():
    op.drop_column("emails", "source_data")
    op.drop_column("emails", "list_unsubscribe_header")
