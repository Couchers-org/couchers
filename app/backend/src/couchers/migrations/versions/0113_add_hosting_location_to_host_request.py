"""add hosting location to host request

Revision ID: 0113
Revises: 0112
Create Date: 2025-07-07 21:01:50.381450

"""

import sqlalchemy as sa
from alembic import op
from geoalchemy2 import Geometry

# revision identifiers, used by Alembic.
revision = "0113"
down_revision = "0112"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "host_requests",
        sa.Column("hosting_city", sa.String(), nullable=False, server_default="unknown"),
    )
    op.add_column(
        "host_requests",
        sa.Column(
            "hosting_location", Geometry("POINT", srid=4326), nullable=False, server_default="SRID=4326;POINT(0 0)"
        ),
    )
    op.add_column(
        "host_requests",
        sa.Column("hosting_radius", sa.Float(), nullable=False, server_default="0"),
    )
    op.alter_column("host_requests", "hosting_city", server_default=None)
    op.alter_column("host_requests", "hosting_location", server_default=None)
    op.alter_column("host_requests", "hosting_radius", server_default=None)


def downgrade() -> None:
    op.drop_column("host_requests", "hosting_radius")
    op.drop_column("host_requests", "hosting_location")
    op.drop_column("host_requests", "hosting_city")
