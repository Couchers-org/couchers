"""Add filled_contributor_form to user

Revision ID: 723394ace6b5
Revises: 27a2782784d0
Create Date: 2021-04-11 11:48:11.170484

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "723394ace6b5"
down_revision = "27a2782784d0"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("filled_contributor_form", sa.Boolean(), server_default="false", nullable=False))


def downgrade():
    op.drop_column("users", "filled_contributor_form")
