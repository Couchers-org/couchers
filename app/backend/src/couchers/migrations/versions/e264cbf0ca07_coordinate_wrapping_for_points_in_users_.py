"""Coordinate wrapping for points in Users, PageVersions, Events

Revision ID: e264cbf0ca07
Revises: 723394ace6b5
Create Date: 2021-04-25 14:13:28.738902

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "e264cbf0ca07"
down_revision = "723394ace6b5"
branch_labels = None
depends_on = None


def upgrade():
    """
    Cast points to geography and back to wrap coordinates
    """
    op.execute("""
    UPDATE users
    SET geom = (ST_SetSRID( geom, 4326)::geography )::geometry
    """)

    op.execute("""
    UPDATE page_Versions
    SET geom = (ST_SetSRID( geom, 4326)::geography )::geometry
    """)

    op.execute("""
    UPDATE events
    SET geom = (ST_SetSRID( geom, 4326)::geography )::geometry
    """)


def downgrade():
    pass
