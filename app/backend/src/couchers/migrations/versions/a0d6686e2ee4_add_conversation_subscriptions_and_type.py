"""add_conversation_subscriptions_and_type

Revision ID: a0d6686e2ee4
Revises: f8b4ef6e3819
Create Date: 2026-01-01 19:00:13.067150

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "a0d6686e2ee4"
down_revision = "f8b4ef6e3819"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create ConversationType enum
    conversationtype = postgresql.ENUM("group_chat", "host_request", name="conversationtype")
    conversationtype.create(op.get_bind())

    # 2. Add type column to conversations table (nullable first)
    op.add_column("conversations", sa.Column("type", conversationtype, nullable=True))

    # 3. Populate conversation types for existing data
    op.execute("""
        UPDATE conversations SET type = 'group_chat'
        WHERE id IN (SELECT id FROM group_chats)
    """)
    op.execute("""
        UPDATE conversations SET type = 'host_request'
        WHERE id IN (SELECT id FROM host_requests)
    """)

    # 4. Make type NOT NULL
    op.alter_column("conversations", "type", nullable=False)

    # 5. Create conversation_subscriptions table
    op.execute("""
        CREATE TABLE conversation_subscriptions (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id),
            conversation_id BIGINT NOT NULL REFERENCES conversations(id),
            is_archived BOOLEAN NOT NULL DEFAULT false,
            last_seen_message_id BIGINT NOT NULL DEFAULT 0,
            muted_until TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMESTAMP '-infinity',
            joined TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "left" TIMESTAMP WITH TIME ZONE,
            role groupchatrole,
            UNIQUE (user_id, conversation_id)
        )
    """)

    # 6. Create indexes
    op.create_index("ix_conversation_subs_user_archived", "conversation_subscriptions", ["user_id", "is_archived"])
    op.create_index("ix_conversation_subs_user_conv", "conversation_subscriptions", ["user_id", "conversation_id"])
    op.create_index(
        op.f("ix_conversation_subscriptions_conversation_id"), "conversation_subscriptions", ["conversation_id"]
    )
    op.create_index(op.f("ix_conversation_subscriptions_user_id"), "conversation_subscriptions", ["user_id"])


def downgrade() -> None:
    # 1. Drop conversation_subscriptions table and indexes
    op.drop_index(op.f("ix_conversation_subscriptions_user_id"), table_name="conversation_subscriptions")
    op.drop_index(op.f("ix_conversation_subscriptions_conversation_id"), table_name="conversation_subscriptions")
    op.drop_index("ix_conversation_subs_user_conv", table_name="conversation_subscriptions")
    op.drop_index("ix_conversation_subs_user_archived", table_name="conversation_subscriptions")
    op.drop_table("conversation_subscriptions")

    # 2. Drop type column from conversations
    op.drop_column("conversations", "type")

    # 3. Drop ConversationType enum
    conversationtype = postgresql.ENUM("group_chat", "host_request", name="conversationtype")
    conversationtype.drop(op.get_bind())
