"""Migrate online events to offline

Revision ID: 0171
Revises: 0170
Create Date: 2026-07-15 08:37:59.486024

"""

import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0171"
down_revision = "0170"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop mutually exclusive constraints (raw DDL operations, naming convention doesn't apply)
    op.drop_constraint("ck_event_occurrences_geom_iff_address", "event_occurrences", type_="check")
    op.drop_constraint("ck_event_occurrences_link_or_geom", "event_occurrences", type_="check")
    # Migrate link to dummy geom+address
    op.execute(
        """
        UPDATE event_occurrences
        SET address = link, geom = ST_SetSRID(ST_MakePoint(0, 0), 4326)
        WHERE link IS NOT NULL
        """
    )
    op.drop_column("event_occurrences", "link")
    # Make geom+address non-nullable
    op.alter_column(
        "event_occurrences",
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
    op.alter_column("event_occurrences", "address", existing_type=sa.VARCHAR(), nullable=False)


def downgrade() -> None:
    # Add back link
    op.add_column("event_occurrences", sa.Column("link", sa.VARCHAR(), autoincrement=False, nullable=True))
    # Make address/geom nullable again
    op.alter_column("event_occurrences", "address", existing_type=sa.VARCHAR(), nullable=True)
    op.alter_column(
        "event_occurrences",
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
    # Add back mutually exclusive constraints (raw DDL operations, naming convention doesn't apply)
    op.create_check_constraint(
        "ck_event_occurrences_geom_iff_address", "event_occurrences", "(geom IS NULL) = (address IS NULL)"
    )
    op.create_check_constraint(
        "ck_event_occurrences_link_or_geom", "event_occurrences", "(geom IS NULL) <> (link IS NULL)"
    )
