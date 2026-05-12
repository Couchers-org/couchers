"""Add filled_contributor_form to user

Revision ID: 0002
Revises: 0001
Create Date: 2021-04-11 11:48:11.170484

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("filled_contributor_form", sa.Boolean(), server_default="false", nullable=False))


def downgrade() -> None:
    op.drop_column("users", "filled_contributor_form")
