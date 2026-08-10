"""Index messages(conversation_id, id) for unread counts, and cover time in the text-only index

Revision ID: 0177
Revises: 0176
Create Date: 2026-08-02 00:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0177"
down_revision = "0176"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # both are created under new names so they can be built by hand ahead of the deploy without this
    # migration then dropping and rebuilding them
    with op.get_context().autocommit_block():
        op.create_index(
            "ix_messages_conversation_id_id",
            "messages",
            ["conversation_id", "id"],
            postgresql_concurrently=True,
            if_not_exists=True,
        )
        op.create_index(
            "ix_messages_conversation_id_id_time_text_only",
            "messages",
            ["conversation_id", "id"],
            postgresql_include=["time"],
            postgresql_where="message_type = 'text'",
            postgresql_concurrently=True,
            if_not_exists=True,
        )
        # superseded by ix_messages_conversation_id_id_time_text_only
        op.drop_index(
            "ix_messages_conversation_id_id_text_only",
            table_name="messages",
            postgresql_concurrently=True,
            if_exists=True,
        )
        # superseded by ix_messages_conversation_id, which leads with the same column
        op.drop_index(
            "ix_messages_conversation_id",
            table_name="messages",
            postgresql_concurrently=True,
            if_exists=True,
        )


def downgrade() -> None:
    with op.get_context().autocommit_block():
        op.create_index(
            "ix_messages_conversation_id",
            "messages",
            ["conversation_id"],
            postgresql_concurrently=True,
            if_not_exists=True,
        )
        op.create_index(
            "ix_messages_conversation_id_id_text_only",
            "messages",
            ["conversation_id", "id"],
            postgresql_where="message_type = 'text'",
            postgresql_concurrently=True,
            if_not_exists=True,
        )
        op.drop_index(
            "ix_messages_conversation_id_id_time_text_only",
            table_name="messages",
            postgresql_concurrently=True,
            if_exists=True,
        )
        op.drop_index(
            "ix_messages_conversation_id_id",
            table_name="messages",
            postgresql_concurrently=True,
            if_exists=True,
        )
