"""Cover time in the messages(conversation_id, id) index

Revision ID: 0179
Revises: 0178
Create Date: 2026-08-02 12:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0179"
down_revision = "0178"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.create_index(
            "ix_messages_conversation_id_id_time",
            "messages",
            ["conversation_id", "id"],
            postgresql_include=["time"],
            postgresql_concurrently=True,
            if_not_exists=True,
        )
        op.drop_index(
            "ix_messages_conversation_id_id",
            table_name="messages",
            postgresql_concurrently=True,
            if_exists=True,
        )


def downgrade() -> None:
    with op.get_context().autocommit_block():
        op.create_index(
            "ix_messages_conversation_id_id",
            "messages",
            ["conversation_id", "id"],
            postgresql_concurrently=True,
            if_not_exists=True,
        )
        op.drop_index(
            "ix_messages_conversation_id_id_time",
            table_name="messages",
            postgresql_concurrently=True,
            if_exists=True,
        )
