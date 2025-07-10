"""add hosting location to host request

Revision ID: 8c878b177151
Revises: 14585a4e1868
Create Date: 2025-07-07 21:01:50.381450

"""

import sqlalchemy as sa
from alembic import op
from geoalchemy2 import Geometry

# revision identifiers, used by Alembic.
revision = "8c878b177151"
down_revision = "14585a4e1868"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("host_requests", sa.Column("hosting_city", sa.String(), nullable=True))
    op.add_column("host_requests", sa.Column("hosting_location", Geometry("POINT", srid=4326), nullable=True))
    op.add_column("host_requests", sa.Column("hosting_radius", sa.Float(), nullable=True))


def downgrade():
    op.drop_column("host_requests", "hosting_radius")
    op.drop_column("host_requests", "hosting_location")
    op.drop_column("host_requests", "hosting_city")
