"""enforce_community_membership_background_job

Revision ID: d3cee8207c3d
Revises: 3b8d963e0b7d
Create Date: 2021-06-05 11:24:10.551584

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "d3cee8207c3d"
down_revision = "3b8d963e0b7d"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE backgroundjobtype ADD VALUE 'enforce_community_membership'")


def downgrade():
    pass
