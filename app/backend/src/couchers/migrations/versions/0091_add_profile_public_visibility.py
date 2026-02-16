"""Add profile public visibility

Revision ID: 8f056dd44a58
Revises: 07ecff50fe93
Create Date: 2024-07-13 17:08:33.761879

"""

import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "8f056dd44a58"
down_revision = "07ecff50fe93"
branch_labels = None
depends_on = None


def upgrade() -> None:
    profilepublicvisibility = sa.Enum("nothing", "map_only", "limited", "most", "full", name="profilepublicvisibility")
    profilepublicvisibility.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "users",
        sa.Column(
            "public_visibility",
            profilepublicvisibility,
            server_default="map_only",
            nullable=False,
        ),
    )
    op.add_column(
        "users",
        sa.Column("has_modified_public_visibility", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )
    op.add_column(
        "users",
        sa.Column(
            "randomized_geom",
            geoalchemy2.types.Geometry(geometry_type="POINT", srid=4326, from_text="ST_GeomFromEWKT", name="geometry"),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "has_modified_public_visibility")
    op.drop_column("users", "public_visibility")
    op.drop_column("users", "randomized_geom")
