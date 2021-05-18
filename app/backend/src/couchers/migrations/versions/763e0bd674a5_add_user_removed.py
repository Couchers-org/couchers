"""Add user_removed

Revision ID: 763e0bd674a5
Revises: a3700d2af277
Create Date: 2021-05-13 15:48:22.513281

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "763e0bd674a5"
down_revision = "a3700d2af277"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE messagetype ADD VALUE 'user_removed'")


def downgrade():
    pass
