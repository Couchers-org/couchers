"""Update materialized views

Revision ID: d345174cb002
Revises: 14585a4e1868
Create Date: 2025-07-15 22:26:20.565635

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "d345174cb002"
down_revision = "14585a4e1868"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DROP MATERIALIZED VIEW clustered_users;")
    op.execute(
        """
        CREATE MATERIALIZED VIEW clustered_users AS
        WITH clustered AS (
            SELECT
                users.id AS id,
                users.geom AS geom,
                ST_ClusterDBSCAN(users.geom, 0.15, 5) OVER (ORDER BY users.id) AS cluster_id
            FROM users
            WHERE NOT (users.is_banned OR users.is_deleted)
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


def downgrade() -> None:
    raise Exception("Can't downgrade")
