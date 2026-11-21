"""Add tables for the community checks

Revision ID: 0207
Revises: 0206
"""

import sqlalchemy as sa
from alembic import op

revision = "0207"
down_revision = "0206"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "community_issues",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column(
            "rule",
            sa.Enum(
                "parent_loop",
                "missing_parent",
                "official_cluster",
                "type_by_level",
                "type_not_below_parent",
                "duplicate_boundary",
                "invalid_boundary",
                "outside_parent",
                "overlap",
                "oversized_city",
                name="communityissuerule",
            ),
            nullable=False,
        ),
        sa.Column("priority", sa.Enum("high", "medium", "low", name="communityissuepriority"), nullable=False),
        sa.Column("node_id", sa.BigInteger(), nullable=False),
        sa.Column("other_node_id", sa.BigInteger(), nullable=True),
        sa.Column("area_km2", sa.Float(), nullable=True),
        sa.Column("share", sa.Float(), nullable=True),
        sa.Column("details", sa.String(), nullable=False),
        sa.Column("area_geojson", sa.String(), nullable=True),
        sa.Column("first_seen", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen", sa.DateTime(timezone=True), nullable=False),
        sa.Column("resolved", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["node_id"], ["nodes.id"], name=op.f("fk_community_issues_node_id_nodes"), ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["other_node_id"], ["nodes.id"], name=op.f("fk_community_issues_other_node_id_nodes"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_community_issues")),
    )
    op.create_index(op.f("ix_community_issues_node_id"), "community_issues", ["node_id"], unique=False)
    op.create_index("ix_community_issues_resolved", "community_issues", ["resolved"], unique=False)
    op.create_index(
        "ix_community_issues_open",
        "community_issues",
        ["rule", "node_id", sa.text("coalesce(other_node_id, 0)")],
        unique=True,
        postgresql_where=sa.text("resolved IS NULL"),
    )
    op.create_table(
        "community_check_runs",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("time", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("open_issues", sa.Integer(), nullable=False),
        sa.Column("active_users", sa.Integer(), nullable=False),
        sa.Column("active_users_outside_localities", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_community_check_runs")),
    )


def downgrade() -> None:
    op.drop_table("community_check_runs")
    op.drop_index("ix_community_issues_open", table_name="community_issues")
    op.drop_index("ix_community_issues_resolved", table_name="community_issues")
    op.drop_index(op.f("ix_community_issues_node_id"), table_name="community_issues")
    op.drop_table("community_issues")
    sa.Enum(name="communityissuepriority").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="communityissuerule").drop(op.get_bind(), checkfirst=True)
