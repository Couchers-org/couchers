"""Add mobile push notification support

Revision ID: 0119
Revises: 0118
Create Date: 2025-11-15 10:55:36.401287

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0119"
down_revision = "0118"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create new enums
    push_notification_platform = sa.Enum("web_push", "expo", name="pushnotificationplatform")
    push_notification_platform.create(op.get_bind())

    device_type = sa.Enum("ios", "android", name="devicetype")
    device_type.create(op.get_bind())

    push_notification_delivery_outcome = sa.Enum(
        "success",
        "transient_failure",
        "permanent_message_failure",
        "permanent_subscription_failure",
        name="pushnotificationdeliveryoutcome",
    )
    push_notification_delivery_outcome.create(op.get_bind())

    # Add new columns to push_notification_subscriptions
    op.add_column(
        "push_notification_subscriptions",
        sa.Column("platform", push_notification_platform, nullable=True),
    )
    op.add_column(
        "push_notification_subscriptions",
        sa.Column("token", sa.String(), nullable=True),
    )
    op.add_column(
        "push_notification_subscriptions",
        sa.Column("device_name", sa.String(), nullable=True),
    )
    op.add_column(
        "push_notification_subscriptions",
        sa.Column("device_type", device_type, nullable=True),
    )

    # Make web_push-specific columns nullable
    op.alter_column("push_notification_subscriptions", "endpoint", existing_type=sa.String(), nullable=True)
    op.alter_column("push_notification_subscriptions", "auth_key", existing_type=sa.LargeBinary(), nullable=True)
    op.alter_column("push_notification_subscriptions", "p256dh_key", existing_type=sa.LargeBinary(), nullable=True)
    op.alter_column(
        "push_notification_subscriptions", "full_subscription_info", existing_type=sa.String(), nullable=True
    )

    # Backfill existing rows as web_push
    op.execute("UPDATE push_notification_subscriptions SET platform = 'web_push'")

    # Now make platform non-nullable
    op.alter_column("push_notification_subscriptions", "platform", nullable=False)

    # Add index on token
    op.create_index(
        op.f("ix_push_notification_subscriptions_token"),
        "push_notification_subscriptions",
        ["token"],
        unique=True,
    )

    # Add check constraint for platform-specific columns
    op.create_check_constraint(
        "platform_columns",
        "push_notification_subscriptions",
        """
        (platform = 'web_push' AND endpoint IS NOT NULL AND auth_key IS NOT NULL AND p256dh_key IS NOT NULL AND full_subscription_info IS NOT NULL AND token IS NULL)
        OR
        (platform = 'expo' AND token IS NOT NULL AND endpoint IS NULL AND auth_key IS NULL AND p256dh_key IS NULL AND full_subscription_info IS NULL)
        """,
    )

    # Update push_notification_delivery_attempt: replace success bool with outcome enum
    op.add_column(
        "push_notification_delivery_attempt",
        sa.Column("outcome", push_notification_delivery_outcome, nullable=True),
    )

    # Backfill outcome based on success
    op.execute("""
        UPDATE push_notification_delivery_attempt
        SET outcome = CASE WHEN success THEN 'success'::pushnotificationdeliveryoutcome ELSE 'transient_failure'::pushnotificationdeliveryoutcome END
    """)

    # Make outcome non-nullable and drop success
    op.alter_column("push_notification_delivery_attempt", "outcome", nullable=False)
    op.drop_column("push_notification_delivery_attempt", "success")

    # Make status_code nullable
    op.alter_column("push_notification_delivery_attempt", "status_code", existing_type=sa.Integer(), nullable=True)

    # Add columns for Expo receipt checking
    op.add_column(
        "push_notification_delivery_attempt",
        sa.Column("expo_ticket_id", sa.String(), nullable=True),
    )
    op.add_column(
        "push_notification_delivery_attempt",
        sa.Column("receipt_checked_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "push_notification_delivery_attempt",
        sa.Column("receipt_status", sa.String(), nullable=True),
    )
    op.add_column(
        "push_notification_delivery_attempt",
        sa.Column("receipt_error_code", sa.String(), nullable=True),
    )


def downgrade() -> None:
    # Drop Expo receipt checking columns
    op.drop_column("push_notification_delivery_attempt", "receipt_error_code")
    op.drop_column("push_notification_delivery_attempt", "receipt_status")
    op.drop_column("push_notification_delivery_attempt", "receipt_checked_at")
    op.drop_column("push_notification_delivery_attempt", "expo_ticket_id")

    # Re-add success column
    op.add_column(
        "push_notification_delivery_attempt",
        sa.Column("success", sa.Boolean(), nullable=True),
    )

    # Backfill success based on outcome
    op.execute("""
        UPDATE push_notification_delivery_attempt
        SET success = (outcome = 'success'::pushnotificationdeliveryoutcome)
    """)

    op.alter_column("push_notification_delivery_attempt", "success", nullable=False)
    op.drop_column("push_notification_delivery_attempt", "outcome")

    # Make status_code non-nullable (may fail if there are NULLs)
    op.alter_column("push_notification_delivery_attempt", "status_code", existing_type=sa.Integer(), nullable=False)

    # Drop check constraint
    op.drop_constraint("platform_columns", "push_notification_subscriptions", type_="check")

    # Drop token index
    op.drop_index(op.f("ix_push_notification_subscriptions_token"), table_name="push_notification_subscriptions")

    # Make web_push columns non-nullable again (may fail if there are expo rows)
    op.alter_column("push_notification_subscriptions", "endpoint", existing_type=sa.String(), nullable=False)
    op.alter_column("push_notification_subscriptions", "auth_key", existing_type=sa.LargeBinary(), nullable=False)
    op.alter_column("push_notification_subscriptions", "p256dh_key", existing_type=sa.LargeBinary(), nullable=False)
    op.alter_column(
        "push_notification_subscriptions", "full_subscription_info", existing_type=sa.String(), nullable=False
    )

    # Drop new columns
    op.drop_column("push_notification_subscriptions", "device_type")
    op.drop_column("push_notification_subscriptions", "device_name")
    op.drop_column("push_notification_subscriptions", "token")
    op.drop_column("push_notification_subscriptions", "platform")

    # Drop enums
    sa.Enum(name="pushnotificationdeliveryoutcome").drop(op.get_bind())
    sa.Enum(name="devicetype").drop(op.get_bind())
    sa.Enum(name="pushnotificationplatform").drop(op.get_bind())
