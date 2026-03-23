"""Coordinate wrapping for Users, Events, Page_Versions

Revision ID: 0004
Revises: 0003
Create Date: 2021-05-02 12:03:43.004161

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Cast points to geography and back to wrap coordinates
    """
    op.execute("UPDATE users SET geom = (ST_SetSRID(geom, 4326)::geography)::geometry")

    op.execute("UPDATE page_Versions SET geom = (ST_SetSRID(geom, 4326)::geography)::geometry")

    op.execute("UPDATE events SET geom = (ST_SetSRID(geom, 4326)::geography)::geometry")


def downgrade() -> None:
    pass
