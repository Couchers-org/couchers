"""Add node_type to nodes

Revision ID: dc28e9bd2b31
Revises: 2e9def7290b9
Create Date: 2026-02-15 14:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "dc28e9bd2b31"
down_revision = "2e9def7290b9"
branch_labels = None
depends_on = None


def upgrade():
    nodetype_enum = sa.Enum("world", "region", "subregion", "locality", "sublocality", name="nodetype")
    nodetype_enum.create(op.get_bind())

    op.add_column("nodes", sa.Column("node_type", nodetype_enum, nullable=True))

    # Backfill using a recursive CTE that computes depth from the root
    op.execute(
        """
        WITH RECURSIVE node_depth AS (
            SELECT id, 0 AS depth
            FROM nodes
            WHERE parent_node_id IS NULL
            UNION ALL
            SELECT n.id, nd.depth + 1
            FROM nodes n
            JOIN node_depth nd ON n.parent_node_id = nd.id
        )
        UPDATE nodes
        SET node_type = CASE nd.depth
            WHEN 0 THEN 'world'
            WHEN 1 THEN 'region'
            WHEN 2 THEN 'subregion'
            WHEN 3 THEN 'locality'
            WHEN 4 THEN 'sublocality'
        END::nodetype
        FROM node_depth nd
        WHERE nodes.id = nd.id
        """
    )

    op.alter_column("nodes", "node_type", nullable=False)


def downgrade():
    op.drop_column("nodes", "node_type")
    sa.Enum(name="nodetype").drop(op.get_bind())
