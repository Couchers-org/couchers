"""Add mobile push notification tables

Revision ID: 4b5abd6bc5c0
Revises: 91bd06f6a96a
Create Date: 2025-11-15 10:55:36.401287

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "4b5abd6bc5c0"
down_revision = "91bd06f6a96a"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "mobile_push_notification_subscriptions",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("token", sa.String(), nullable=False),
        sa.Column("platform", sa.String(), nullable=False),
        sa.Column("device_name", sa.String(), nullable=True),
        sa.Column("device_type", sa.String(), nullable=True),
        sa.Column(
            "disabled_at",
            sa.DateTime(timezone=True),
            server_default="9876-12-31T23:59:59+00:00",
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_mobile_push_subscriptions_user_id")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_mobile_push_notification_subscriptions")),
    )
    op.create_index(
        op.f("ix_mobile_push_notification_subscriptions_user_id"),
        "mobile_push_notification_subscriptions",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_mobile_push_notification_subscriptions_token"),
        "mobile_push_notification_subscriptions",
        ["token"],
        unique=True,
    )
    op.create_index(
        "ix_mobile_push_notification_subscriptions_active",
        "mobile_push_notification_subscriptions",
        ["user_id"],
        unique=False,
        postgresql_where=sa.text("disabled_at > now()"),
    )

    op.create_table(
        "mobile_push_notification_delivery_attempts",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("time", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("mobile_push_notification_subscription_id", sa.BigInteger(), nullable=False),
        sa.Column("success", sa.Boolean(), nullable=False),
        sa.Column("status_code", sa.Integer(), nullable=False),
        sa.Column("response", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(
            ["mobile_push_notification_subscription_id"],
            ["mobile_push_notification_subscriptions.id"],
            name=op.f("fk_mobile_push_notification_delivery_attempts_subscription_id"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_mobile_push_notification_delivery_attempts")),
    )
    op.create_index(
        op.f("ix_mobile_push_notification_delivery_attempts_subscription_id"),
        "mobile_push_notification_delivery_attempts",
        ["mobile_push_notification_subscription_id"],
        unique=False,
    )


def downgrade():
    op.drop_index(
        op.f("ix_mobile_push_notification_delivery_attempts_subscription_id"),
        table_name="mobile_push_notification_delivery_attempts",
    )
    op.drop_table("mobile_push_notification_delivery_attempts")
    op.drop_index(
        "ix_mobile_push_notification_subscriptions_active", table_name="mobile_push_notification_subscriptions"
    )
    op.drop_index(
        op.f("ix_mobile_push_notification_subscriptions_token"), table_name="mobile_push_notification_subscriptions"
    )
    op.drop_index(
        op.f("ix_mobile_push_notification_subscriptions_user_id"), table_name="mobile_push_notification_subscriptions"
    )
    op.drop_table("mobile_push_notification_subscriptions")
