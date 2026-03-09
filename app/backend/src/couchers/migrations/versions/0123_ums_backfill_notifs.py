"""UMS backfill notifs

Revision ID: 0123
Revises: 0122
Create Date: 2025-12-08 02:24:10.625443

"""

from alembic import op
from sqlalchemy import text

from couchers.proto import notification_data_pb2

# revision identifiers, used by Alembic.
revision = "0123"
down_revision = "0122"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    # Backfill key for host_request__reminder notifications
    # Extract host_request_id from HostRequestReminder proto
    result = conn.execute(
        text("""
            SELECT n.id, n.data
            FROM notifications n
            WHERE n.topic_action::text = 'host_request__reminder'
              AND (n.key = '' OR n.key IS NULL)
        """)
    ).fetchall()

    updates = []
    for row in result:
        notification_id, data = row
        reminder = notification_data_pb2.HostRequestReminder.FromString(bytes(data))
        host_request_id = reminder.host_request.host_request_id
        if host_request_id:
            updates.append({"key": str(host_request_id), "id": notification_id})

    if updates:
        conn.execute(
            text("UPDATE notifications SET key = :key WHERE id = :id"),
            updates,
        )

    # Backfill key for reference__receive_surfed and reference__receive_hosted notifications
    # Extract host_request_id from ReferenceReceiveHostRequest proto
    result = conn.execute(
        text("""
            SELECT n.id, n.data
            FROM notifications n
            WHERE n.topic_action::text IN ('reference__receive_surfed', 'reference__receive_hosted')
              AND (n.key = '' OR n.key IS NULL)
        """)
    ).fetchall()

    updates = []
    for row in result:
        notification_id, data = row
        ref_receive = notification_data_pb2.ReferenceReceiveHostRequest.FromString(bytes(data))
        host_request_id = ref_receive.host_request_id
        if host_request_id:
            updates.append({"key": str(host_request_id), "id": notification_id})

    if updates:
        conn.execute(
            text("UPDATE notifications SET key = :key WHERE id = :id"),
            updates,
        )

    # Backfill key for reference__reminder_surfed and reference__reminder_hosted notifications
    # Extract host_request_id from ReferenceReminder proto
    result = conn.execute(
        text("""
            SELECT n.id, n.data
            FROM notifications n
            WHERE n.topic_action::text IN ('reference__reminder_surfed', 'reference__reminder_hosted')
              AND (n.key = '' OR n.key IS NULL)
        """)
    ).fetchall()

    updates = []
    for row in result:
        notification_id, data = row
        ref_reminder = notification_data_pb2.ReferenceReminder.FromString(bytes(data))
        host_request_id = ref_reminder.host_request_id
        if host_request_id:
            updates.append({"key": str(host_request_id), "id": notification_id})

    if updates:
        conn.execute(
            text("UPDATE notifications SET key = :key WHERE id = :id"),
            updates,
        )

    # Backfill key for event__reminder notifications
    # Extract event_id from EventReminder proto
    result = conn.execute(
        text("""
            SELECT n.id, n.data
            FROM notifications n
            WHERE n.topic_action::text = 'event__reminder'
              AND (n.key = '' OR n.key IS NULL)
        """)
    ).fetchall()

    updates = []
    for row in result:
        notification_id, data = row
        event_reminder = notification_data_pb2.EventReminder.FromString(bytes(data))
        event_id = event_reminder.event.event_id
        if event_id:
            updates.append({"key": str(event_id), "id": notification_id})

    if updates:
        conn.execute(
            text("UPDATE notifications SET key = :key WHERE id = :id"),
            updates,
        )

    # Backfill moderation_state_id for host_request notifications
    # The notification key contains the conversation_id, which is the host_request.id
    # Only process rows where key is non-empty and numeric
    op.execute(r"""
        UPDATE notifications n
        SET moderation_state_id = hr.moderation_state_id
        FROM host_requests hr
        WHERE n.moderation_state_id IS NULL
          AND n.topic_action::text LIKE 'host\_request\_\_%'
          AND n.key <> ''
          AND n.key ~ '^[0-9]+$'
          AND n.key::bigint = hr.id
    """)

    # Backfill moderation_state_id for chat notifications
    # The notification key contains the conversation_id, which is the group_chat.id
    op.execute(r"""
        UPDATE notifications n
        SET moderation_state_id = gc.moderation_state_id
        FROM group_chats gc
        WHERE n.moderation_state_id IS NULL
          AND n.topic_action::text LIKE 'chat\_\_%'
          AND n.key <> ''
          AND n.key ~ '^[0-9]+$'
          AND n.key::bigint = gc.id
    """)


def downgrade() -> None:
    # Note: We don't clear the moderation_state_id on downgrade because:
    # 1. It's nullable and having it set doesn't break anything
    # 2. We can't distinguish backfilled values from values set during normal operation
    pass
