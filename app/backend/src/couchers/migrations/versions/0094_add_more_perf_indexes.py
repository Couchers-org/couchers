"""Add more perf indexes

Revision ID: cd456767d2f7
Revises: f7d5de383e11
Create Date: 2025-05-24 20:09:09.274188

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "cd456767d2f7"
down_revision = "f7d5de383e11"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_cluster_subscriptions_admins",
        "cluster_subscriptions",
        ["user_id", "cluster_id"],
        unique=False,
        postgresql_where=sa.text("role = 'admin'"),
    )
    op.create_index(
        "ix_cluster_subscriptions_members", "cluster_subscriptions", ["cluster_id", "user_id"], unique=False
    )
    op.create_index("ix_sessions_by_token", "sessions", ["token"], unique=False, postgresql_using="hash")
    op.create_index(
        "ix_user_blocks_blocked_user_id", "user_blocks", ["blocked_user_id", "blocking_user_id"], unique=False
    )
    op.create_index(
        "ix_user_blocks_blocking_user_id", "user_blocks", ["blocking_user_id", "blocked_user_id"], unique=False
    )
    op.create_index(
        "ix_users_by_id",
        "users",
        ["id"],
        unique=False,
        postgresql_using="hash",
        postgresql_where=sa.text("NOT is_banned AND NOT is_deleted"),
    )
    op.create_index(
        "ix_users_by_username",
        "users",
        ["username"],
        unique=False,
        postgresql_using="hash",
        postgresql_where=sa.text("NOT is_banned AND NOT is_deleted"),
    )
    op.execute("""
        DROP INDEX ix_users_geom_active;
        CREATE INDEX ix_users_geom_active ON users USING gist (geom, id, username) WHERE ((NOT is_banned) AND (NOT is_deleted));
        DROP INDEX uq_lite_users_id_visible;
        DROP INDEX uq_lite_users_username_visible;
        CREATE INDEX ix_lite_users_id_visible ON lite_users USING hash (id) WHERE is_visible;
        CREATE INDEX ix_lite_users_username_visible ON lite_users USING hash (username) WHERE is_visible;
    """)


def downgrade() -> None:
    op.drop_index(
        "ix_users_by_username",
        table_name="users",
        postgresql_using="hash",
        postgresql_where=sa.text("NOT is_banned AND NOT is_deleted"),
    )
    op.drop_index(
        "ix_users_by_id",
        table_name="users",
        postgresql_using="hash",
        postgresql_where=sa.text("NOT is_banned AND NOT is_deleted"),
    )
    op.drop_index("ix_user_blocks_blocking_user_id", table_name="user_blocks")
    op.drop_index("ix_user_blocks_blocked_user_id", table_name="user_blocks")
    op.drop_index("ix_sessions_by_token", table_name="sessions", postgresql_using="hash")
    op.drop_index("ix_cluster_subscriptions_members", table_name="cluster_subscriptions")
    op.drop_index(
        "ix_cluster_subscriptions_admins",
        table_name="cluster_subscriptions",
        postgresql_where=sa.text("role = 'admin'"),
    )
    op.execute("""
        DROP INDEX ix_lite_users_id_visible;
        DROP INDEX ix_lite_users_username_visible;
        CREATE INDEX uq_lite_users_id_visible ON lite_users(id) WHERE is_visible;
        CREATE INDEX uq_lite_users_username_visible ON lite_users(username) WHERE is_visible;
        DROP INDEX ix_users_geom_active;
        CREATE INDEX ix_users_geom_active ON public.users USING btree (geom, id, username) WHERE ((NOT is_banned) AND (NOT is_deleted) AND (geom IS NOT NULL));
    """)
