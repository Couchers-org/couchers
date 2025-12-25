"""Make geom required

Revision ID: dc3e31bb80f3
Revises: 8f056dd44a58
Create Date: 2025-05-19 12:37:25.832263

"""

import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "dc3e31bb80f3"
down_revision = "8f056dd44a58"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE users SET geom = ST_SetSRID(ST_MakePoint(0, 0), 4326) WHERE geom IS NULL")
    op.execute("UPDATE users SET geom_radius = 2000 WHERE geom_radius IS NULL")
    op.alter_column(
        "users",
        "geom",
        existing_type=geoalchemy2.types.Geometry(
            geometry_type="POINT",
            srid=4326,
            from_text="ST_GeomFromEWKT",
            name="geometry",
            _spatial_index_reflected=True,
        ),
        nullable=False,
    )
    op.alter_column("users", "geom_radius", existing_type=sa.DOUBLE_PRECISION(precision=53), nullable=False)
    op.add_column("users", sa.Column("needs_to_update_location", sa.Boolean(), server_default="false", nullable=False))


def downgrade() -> None:
    op.drop_column("users", "needs_to_update_location")
    op.alter_column("users", "geom_radius", existing_type=sa.DOUBLE_PRECISION(precision=53), nullable=True)
    op.alter_column(
        "users",
        "geom",
        existing_type=geoalchemy2.types.Geometry(
            geometry_type="POINT",
            srid=4326,
            from_text="ST_GeomFromEWKT",
            name="geometry",
            _spatial_index_reflected=True,
        ),
        nullable=True,
    )
