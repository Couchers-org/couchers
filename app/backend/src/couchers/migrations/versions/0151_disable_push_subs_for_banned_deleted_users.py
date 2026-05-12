"""Disable push subscriptions for already banned or deleted users

Revision ID: 0151
Revises: 0150
Create Date: 2026-05-11 12:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0151"
down_revision = "0150"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Match disable_push_notifications_for_user: only subscriptions still "active"
    # (disabled_at is in the future, including infinity sentinel).
    op.execute(
        """
        UPDATE push_notification_subscriptions AS p
        SET disabled_at = now()
        FROM users AS u
        WHERE p.user_id = u.id
          AND (u.banned_at IS NOT NULL OR u.deleted_at IS NOT NULL)
          AND p.disabled_at > now()
        """
    )


def downgrade() -> None:
    # Cannot restore prior disabled_at values without storing them per row.
    pass
