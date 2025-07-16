"""Add clustered users materialized view

Revision ID: d3f2cb24b948
Revises: 64d94faabb20
Create Date: 2024-10-25 16:11:06.270916

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "d3f2cb24b948"
down_revision = "64d94faabb20"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        CREATE MATERIALIZED VIEW clustered_users AS
        WITH clustered AS (
            SELECT
                users.id AS id,
                users.geom AS geom,
                ST_ClusterDBSCAN(users.geom, 0.15, 5) OVER (ORDER BY users.id) AS cluster_id
            FROM users
            WHERE users.geom IS NOT NULL
        )
        SELECT
            ST_Centroid(ST_Collect(clustered.geom)) AS geom,
            count(*) AS count
        FROM clustered
        WHERE clustered.cluster_id IS NOT NULL
        GROUP BY clustered.cluster_id
        UNION ALL
        SELECT
            clustered.geom AS geom,
            1 AS count
        FROM clustered
        WHERE clustered.cluster_id IS NULL;
        CREATE INDEX idx_clustered_users_geom ON clustered_users USING gist (geom);
    """
    )


def downgrade():
    op.execute("DROP MATERIALIZED VIEW clustered_users")
