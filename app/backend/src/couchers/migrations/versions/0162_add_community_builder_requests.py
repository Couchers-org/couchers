"""Add community_builder_requests

Revision ID: 0162
Revises: 0161
Create Date: 2026-05-31 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0162"
down_revision = "0161"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "community_builder_requests",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("node_id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("decided", sa.DateTime(timezone=True), nullable=True),
        sa.Column("decided_by_user_id", sa.BigInteger(), nullable=True),
        sa.Column("approved", sa.Boolean(), nullable=True),
        sa.CheckConstraint(
            "((decided IS NULL) AND (decided_by_user_id IS NULL) AND (approved IS NULL)) OR              ((decided IS NOT NULL) AND (decided_by_user_id IS NOT NULL) AND (approved IS NOT NULL))",
            name=op.f("ck_community_builder_requests_decided_approved"),
        ),
        sa.ForeignKeyConstraint(
            ["decided_by_user_id"],
            ["users.id"],
            name=op.f("fk_community_builder_requests_decided_by_user_id_users"),
        ),
        sa.ForeignKeyConstraint(
            ["node_id"],
            ["nodes.id"],
            name=op.f("fk_community_builder_requests_node_id_nodes"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_community_builder_requests_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_community_builder_requests")),
    )
    op.create_index(
        op.f("ix_community_builder_requests_node_id"),
        "community_builder_requests",
        ["node_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_community_builder_requests_user_id"),
        "community_builder_requests",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_community_builder_requests_pending_unique",
        "community_builder_requests",
        ["node_id", "user_id"],
        unique=True,
        postgresql_where=sa.text("approved IS NULL"),
    )


def downgrade() -> None:
    op.drop_index("ix_community_builder_requests_pending_unique", table_name="community_builder_requests")
    op.drop_index(op.f("ix_community_builder_requests_user_id"), table_name="community_builder_requests")
    op.drop_index(op.f("ix_community_builder_requests_node_id"), table_name="community_builder_requests")
    op.drop_table("community_builder_requests")
