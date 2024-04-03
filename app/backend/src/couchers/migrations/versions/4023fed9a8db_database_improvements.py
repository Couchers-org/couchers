"""Database improvements

Revision ID: 4023fed9a8db
Revises: 8121c15b01c0
Create Date: 2022-10-13 10:32:12.203554

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "4023fed9a8db"
down_revision = "8121c15b01c0"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "api_calls",
        sa.Column("response_truncated", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        schema="logging",
    )

    op.create_index(
        "ix_users_geom_active",
        "users",
        ["geom", "id", "username"],
        unique=False,
        postgresql_where=sa.text("NOT is_banned AND NOT is_deleted AND geom IS NOT NULL"),
    )

    op.create_index(
        "ix_background_jobs_lookup",
        "background_jobs",
        ["next_attempt_after", (sa.column("max_tries") - sa.column("try_count"))],
        unique=False,
        postgresql_where=sa.text("state = 'pending' OR state = 'error'"),
    )

    op.drop_index(op.f("ix_background_jobs_state_next_attempt_after"), table_name="background_jobs")

    op.create_index(
        "ix_notification_deliveries_delivery_type",
        "notification_deliveries",
        ["delivery_type"],
        unique=False,
        postgresql_where=sa.text("delivered IS NOT NULL"),
    )
    op.create_index("ix_notifications_created", "notifications", ["created"], unique=False)

    op.execute(
        """
        CREATE MATERIALIZED VIEW cluster_subscription_counts AS
        SELECT cluster_subscriptions.cluster_id, count(*)
        FROM cluster_subscriptions
        LEFT OUTER JOIN users
        ON users.id = cluster_subscriptions.user_id
        WHERE NOT (users.is_banned OR users.is_deleted)
        GROUP BY cluster_subscriptions.cluster_id;

        CREATE UNIQUE INDEX uq_cluster_subscription_counts_cluster_id ON cluster_subscription_counts(cluster_id);

        CREATE MATERIALIZED VIEW cluster_admin_counts AS
        SELECT cluster_subscriptions.cluster_id, count(*)
        FROM cluster_subscriptions
        LEFT OUTER JOIN users
        ON users.id = cluster_subscriptions.user_id
        WHERE cluster_subscriptions.role = 'admin' AND NOT (users.is_banned OR users.is_deleted)
        GROUP BY cluster_subscriptions.cluster_id;

        CREATE UNIQUE INDEX uq_cluster_admin_counts_cluster_id ON cluster_admin_counts(cluster_id);
    """
    )

    op.execute("ALTER TYPE backgroundjobtype ADD VALUE 'refresh_materialized_views'")


def downgrade():
    raise Exception("Can't downgrade")
