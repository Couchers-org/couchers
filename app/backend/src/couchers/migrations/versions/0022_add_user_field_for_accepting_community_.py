"""Add user field for accepting community guidelines

Revision ID: 0022
Revises: 0021
Create Date: 2021-07-15 23:58:27.233804

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0022"
down_revision = "0021"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "signup_flows", sa.Column("accepted_community_guidelines", sa.Integer(), server_default="0", nullable=False)
    )
    op.add_column("users", sa.Column("accepted_community_guidelines", sa.Integer(), server_default="0", nullable=False))


def downgrade() -> None:
    op.drop_column("users", "accepted_community_guidelines")
    op.drop_column("signup_flows", "accepted_community_guidelines")
