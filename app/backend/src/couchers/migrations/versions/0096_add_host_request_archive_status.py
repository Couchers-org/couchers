"""Add host request archive status

Revision ID: 3937eb39a4ca
Revises: 18d100ed2803
Create Date: 2025-06-19 21:51:25.999122

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "3937eb39a4ca"
down_revision = "18d100ed2803"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "host_requests", sa.Column("is_host_archived", sa.Boolean(), server_default=sa.text("false"), nullable=False)
    )
    op.add_column(
        "host_requests", sa.Column("is_surfer_archived", sa.Boolean(), server_default=sa.text("false"), nullable=False)
    )


def downgrade() -> None:
    op.drop_column("host_requests", "is_surfer_archived")
    op.drop_column("host_requests", "is_host_archived")
