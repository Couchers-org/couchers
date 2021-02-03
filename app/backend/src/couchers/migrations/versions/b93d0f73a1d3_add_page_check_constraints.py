"""Add page check constraints

Revision ID: b93d0f73a1d3
Revises: 2affc63b4a01
Create Date: 2021-02-03 10:20:46.238345

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "b93d0f73a1d3"
down_revision = "2affc63b4a01"
branch_labels = None
depends_on = None


def upgrade():
    op.create_check_constraint(
        "ck_clusters_official_cluster_matches_parent_node",
        "clusters",
        "(official_cluster_for_node_id IS NULL) OR (official_cluster_for_node_id = parent_node_id)",
    )
    op.create_check_constraint(
        "ck_pages_one_owner",
        "pages",
        "(owner_user_id IS NULL AND owner_cluster_id IS NOT NULL) OR (owner_user_id IS NOT NULL AND owner_cluster_id IS NULL)",
    )
    op.create_check_constraint(
        "ck_pages_main_page_owned_by_cluster",
        "pages",
        "(main_page_for_cluster_id IS NULL) OR (owner_cluster_id IS NOT NULL AND main_page_for_cluster_id = owner_cluster_id)",
    )


def downgrade():
    op.drop_constraint("ck_clusters_official_cluster_matches_parent_node")
    op.drop_constraint("ck_pages_one_owner")
    op.drop_constraint("ck_pages_main_page_owned_by_cluster")
