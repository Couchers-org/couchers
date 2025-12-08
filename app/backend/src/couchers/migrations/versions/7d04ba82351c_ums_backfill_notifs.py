"""UMS backfill notifs

Revision ID: 7d04ba82351c
Revises: 495d6b415d7d
Create Date: 2025-12-08 02:24:10.625443

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "7d04ba82351c"
down_revision = "495d6b415d7d"
branch_labels = None
depends_on = None


def upgrade():
    # Backfill moderation_state_id for host_request notifications
    # The notification key contains the conversation_id, which is the host_request.id
    op.execute("""
        UPDATE notifications n
        SET moderation_state_id = hr.moderation_state_id
        FROM host_requests hr
        WHERE n.moderation_state_id IS NULL
          AND n.topic_action LIKE 'host\_request\_\_%'
          AND n.key::bigint = hr.id
    """)

    # Backfill moderation_state_id for chat notifications
    # The notification key contains the conversation_id, which is the group_chat.id
    op.execute("""
        UPDATE notifications n
        SET moderation_state_id = gc.moderation_state_id
        FROM group_chats gc
        WHERE n.moderation_state_id IS NULL
          AND n.topic_action LIKE 'chat\_\_%'
          AND n.key::bigint = gc.id
    """)


def downgrade():
    # Note: We don't clear the moderation_state_id on downgrade because:
    # 1. It's nullable and having it set doesn't break anything
    # 2. We can't distinguish backfilled values from values set during normal operation
    pass
