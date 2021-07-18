"""Add user field for accepting community guidelines

Revision ID: f77ccd92eb4d
Revises: e6d03b494119
Create Date: 2021-07-15 23:58:27.233804

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "f77ccd92eb4d"
down_revision = "e6d03b494119"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("accepted_community_guidelines", sa.Integer(), server_default="0", nullable=False))


def downgrade():
    op.drop_column("users", "accepted_community_guidelines")
