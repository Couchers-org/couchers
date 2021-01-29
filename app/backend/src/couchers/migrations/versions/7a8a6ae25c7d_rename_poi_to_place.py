"""Rename POI to place

Revision ID: 7a8a6ae25c7d
Revises: 2affc63b4a01
Create Date: 2021-01-29 15:34:24.474764

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "7a8a6ae25c7d"
down_revision = "2affc63b4a01"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE pagetype RENAME VALUE 'point_of_interest' TO 'place'")


def downgrade():
    op.execute("ALTER TYPE pagetype RENAME VALUE 'place' TO 'point_of_interest'")
