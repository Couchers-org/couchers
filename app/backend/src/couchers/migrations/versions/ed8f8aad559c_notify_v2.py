"""Notify v2

Revision ID: ed8f8aad559c
Revises: 3b63c4706f0d
Create Date: 2024-05-29 20:42:43.642178

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "ed8f8aad559c"
down_revision = "3b63c4706f0d"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("TRUNCATE TABLE notifications CASCADE")
    op.add_column("notifications", sa.Column("data", sa.LargeBinary(), nullable=False))
    op.drop_column("notifications", "content")
    op.drop_column("notifications", "link")
    op.drop_column("notifications", "icon")
    op.drop_column("notifications", "avatar_key")
    op.drop_column("notifications", "title")
    op.drop_column("users", "new_notifications_enabled")
    # this constraint is automatically dropped, so recreate without new notification column
    op.create_check_constraint(
        constraint_name="do_not_email_inactive",
        table_name="users",
        condition="(do_not_email IS FALSE) OR ((hosting_status = 'cant_host') AND (meetup_status = 'does_not_want_to_meetup'))",
    )
    op.execute("ALTER TYPE notificationtopicaction RENAME VALUE 'friend_request__send' TO 'friend_request__create'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'email_address__verify'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'donation__received'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'account_deletion__start'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'account_deletion__complete'")
    op.execute("ALTER TYPE notificationtopicaction RENAME VALUE 'account_recovery__start' TO 'password_reset__start'")
    op.execute(
        "ALTER TYPE notificationtopicaction RENAME VALUE 'account_recovery__complete' TO 'password_reset__complete'"
    )
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'account_deletion__recovered'")
    op.create_table(
        "push_notification_subscriptions",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("endpoint", sa.String(), nullable=False),
        sa.Column("auth_key", sa.LargeBinary(), nullable=False),
        sa.Column("p256dh_key", sa.LargeBinary(), nullable=False),
        sa.Column("full_subscription_info", sa.String(), nullable=False),
        sa.Column(
            "disabled_at", sa.DateTime(timezone=True), server_default="9876-12-31T23:59:59+00:00", nullable=False
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_push_notification_subscriptions_user_id_users")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_push_notification_subscriptions")),
    )
    op.create_index(
        op.f("ix_push_notification_subscriptions_user_id"), "push_notification_subscriptions", ["user_id"], unique=False
    )
    op.create_table(
        "push_notification_delivery_attempt",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("time", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("push_notification_subscription_id", sa.BigInteger(), nullable=False),
        sa.Column("success", sa.Boolean(), nullable=False),
        sa.Column("status_code", sa.Integer(), nullable=False),
        sa.Column("response", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(
            ["push_notification_subscription_id"],
            ["push_notification_subscriptions.id"],
            name=op.f(
                "fk_push_notification_delivery_attempt_push_notification_subscription_id_push_notification_subscriptions"
            ),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_push_notification_delivery_attempt")),
    )
    op.create_index(
        op.f("ix_push_notification_delivery_attempt_push_notification_subscription_id"),
        "push_notification_delivery_attempt",
        ["push_notification_subscription_id"],
        unique=False,
    )


def downgrade():
    raise Exception("Can't downgrade")
