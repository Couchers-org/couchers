"""Add active users by platform metric

Revision ID: 0158
Revises: 0157
Create Date: 2026-05-19 13:57:38.938396

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0158"
down_revision = "0157"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user_activity", sa.Column("sofa", sa.String(), nullable=True))
    op.add_column(
        "user_activity",
        sa.Column(
            "client_platform",
            sa.Enum("web_desktop", "web_mobile", "app_ios", "app_android", name="clientplatform"),
            nullable=True,
        ),
    )
    op.drop_index(op.f("ix_user_activity_user_id_period_ip_address_user_agent"), table_name="user_activity")
    op.create_index(
        "ix_user_activity_user_id_period_ip_address_user_agent_sofa",
        "user_activity",
        ["user_id", "period", "ip_address", "user_agent", "sofa"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_user_activity_user_id_period_ip_address_user_agent_sofa", table_name="user_activity")
    # After the upgrade, rows are binned by sofa too, so multiple rows can share the same
    # (user_id, period, ip_address, user_agent) 4-tuple. Collapse them onto the row with the
    # most api_calls (ties broken by latest id) before recreating the 4-column unique index,
    # otherwise CREATE UNIQUE INDEX would fail with a duplicate-key error.
    op.execute(
        """
        WITH ranked AS (
            SELECT
                id,
                api_calls,
                first_value(id) OVER (
                    PARTITION BY user_id, period, ip_address, user_agent
                    ORDER BY api_calls DESC, id DESC
                ) AS keep_id,
                sum(api_calls) OVER (
                    PARTITION BY user_id, period, ip_address, user_agent
                ) AS total_api_calls
            FROM user_activity
        )
        UPDATE user_activity
        SET api_calls = ranked.total_api_calls
        FROM ranked
        WHERE user_activity.id = ranked.keep_id
          AND user_activity.api_calls <> ranked.total_api_calls
        """
    )
    op.execute(
        """
        DELETE FROM user_activity
        WHERE id IN (
            SELECT id FROM (
                SELECT
                    id,
                    first_value(id) OVER (
                        PARTITION BY user_id, period, ip_address, user_agent
                        ORDER BY api_calls DESC, id DESC
                    ) AS keep_id
                FROM user_activity
            ) ranked
            WHERE id <> keep_id
        )
        """
    )
    op.create_index(
        op.f("ix_user_activity_user_id_period_ip_address_user_agent"),
        "user_activity",
        ["user_id", "period", "ip_address", "user_agent"],
        unique=True,
    )
    op.drop_column("user_activity", "client_platform")
    op.drop_column("user_activity", "sofa")
