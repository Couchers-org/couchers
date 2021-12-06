"""Add notification table

Revision ID: 2630bc1387d1
Revises: 1c809d111871
Create Date: 2021-12-06 03:01:50.820380

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "2630bc1387d1"
down_revision = "1c809d111871"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "notification_preferences",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "topic_action",
            sa.Enum(
                "friend_request__send",
                "friend_request__accept",
                "host_request__create",
                "host_request__accept",
                "host_request__reject",
                "host_request__confirm",
                "host_request__cancel",
                "host_request__message",
                name="notificationtopicaction",
            ),
            nullable=False,
        ),
        sa.Column("delivery_type", sa.Enum("push", "email", "digest", name="notificationdeliverytype"), nullable=False),
        sa.Column("deliver", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_notification_preferences_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_notification_preferences")),
    )
    op.create_index(op.f("ix_notification_preferences_user_id"), "notification_preferences", ["user_id"], unique=False)
    op.create_table(
        "notifications",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("priority", sa.Enum("immediate", "normal", "low", name="notificationpriority"), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "topic_action",
            sa.Enum(
                "friend_request__send",
                "friend_request__accept",
                "host_request__create",
                "host_request__accept",
                "host_request__reject",
                "host_request__confirm",
                "host_request__cancel",
                "host_request__message",
                name="notificationtopicaction",
            ),
            nullable=False,
        ),
        sa.Column("key", sa.String(), nullable=False),
        sa.Column("avatar_key", sa.String(), nullable=True),
        sa.Column("icon", sa.String(), nullable=True),
        sa.Column("title", sa.String(), nullable=True),
        sa.Column("content", sa.String(), nullable=True),
        sa.Column("link", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_notifications_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_notifications")),
    )
    op.create_table(
        "notification_deliveries",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("notification_id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("delivered", sa.DateTime(timezone=True), nullable=True),
        sa.Column("read", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivery_type", sa.Enum("push", "email", "digest", name="notificationdeliverytype"), nullable=False),
        sa.ForeignKeyConstraint(
            ["notification_id"],
            ["notifications.id"],
            name=op.f("fk_notification_deliveries_notification_id_notifications"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_notification_deliveries")),
        sa.UniqueConstraint(
            "notification_id", "delivery_type", name=op.f("uq_notification_deliveries_notification_id")
        ),
    )
    op.create_index(
        op.f("ix_notification_deliveries_notification_id"), "notification_deliveries", ["notification_id"], unique=False
    )
    op.execute("ALTER TYPE backgroundjobtype ADD VALUE 'handle_notification'")
    op.execute("ALTER TYPE backgroundjobtype ADD VALUE 'handle_email_notifications'")


def downgrade():
    op.drop_index(op.f("ix_notification_deliveries_notification_id"), table_name="notification_deliveries")
    op.drop_table("notification_deliveries")
    op.drop_table("notifications")
    op.drop_index(op.f("ix_notification_preferences_user_id"), table_name="notification_preferences")
    op.drop_table("notification_preferences")
