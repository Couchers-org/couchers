"""Add host request archive status

Revision ID: 3937eb39a4ca
Revises: 18d100ed2803
Create Date: 2025-06-19 21:51:25.999122

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "3937eb39a4ca"
down_revision = "cd456767d2f7"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("host_requests", sa.Column("is_host_archived", sa.Boolean(), nullable=False))
    op.add_column("host_requests", sa.Column("is_surfer_archived", sa.Boolean(), nullable=False))


def downgrade():
    op.drop_column("host_requests", "is_surfer_archived")
    op.drop_column("host_requests", "is_host_archived")
