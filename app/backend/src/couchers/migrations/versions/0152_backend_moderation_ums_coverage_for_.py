"""Backend/moderation: UMS coverage for thread comments and replies

Revision ID: 0152
Revises: 0151
Create Date: 2026-05-10 00:57:29.125757

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0152"
down_revision = "0151"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add 'comment' and 'reply' to the ModerationObjectType enum.
    # Must use rename/recreate pattern instead of ADD VALUE, because ADD VALUE
    # cannot be used in the same transaction as DML that references the new value.
    op.execute("ALTER TYPE moderationobjecttype RENAME TO moderationobjecttype_old")
    op.execute(
        "CREATE TYPE moderationobjecttype AS ENUM "
        "('host_request', 'group_chat', 'friend_request', 'event_occurrence', 'comment', 'reply')"
    )
    op.execute("""
        ALTER TABLE moderation_states
        ALTER COLUMN object_type TYPE moderationobjecttype
        USING object_type::text::moderationobjecttype
    """)
    op.execute("DROP TYPE moderationobjecttype_old")

    # Add moderation_state_id columns as nullable so we can backfill before enforcing NOT NULL.
    op.add_column("comments", sa.Column("moderation_state_id", sa.BigInteger(), nullable=True))
    op.add_column("replies", sa.Column("moderation_state_id", sa.BigInteger(), nullable=True))

    # Backfill moderation states for existing comments (using the < 2000000 ID range reserved for backfills)
    op.execute("""
        INSERT INTO moderation_states (id, object_type, object_id, visibility)
        SELECT
            (SELECT COALESCE(MAX(id), 0) FROM moderation_states WHERE id < 2000000) + ROW_NUMBER() OVER (ORDER BY id),
            'comment',
            id,
            'visible'
        FROM comments
    """)
    op.execute("""
        INSERT INTO moderation_log (id, moderation_state_id, action, moderator_user_id, new_visibility, reason)
        SELECT
            (SELECT GREATEST(
                COALESCE((SELECT MAX(id) FROM moderation_states WHERE id < 2000000), 0),
                COALESCE((SELECT MAX(id) FROM moderation_log WHERE id < 2000000), 0)
            )) + ROW_NUMBER() OVER (ORDER BY c.id),
            ms.id,
            'create',
            c.author_user_id,
            'visible',
            'Migration: existing comment'
        FROM moderation_states ms
        JOIN comments c ON ms.object_id = c.id AND ms.object_type = 'comment'
    """)
    op.execute("""
        UPDATE comments
        SET moderation_state_id = moderation_states.id
        FROM moderation_states
        WHERE moderation_states.object_type = 'comment'
        AND moderation_states.object_id = comments.id
    """)

    # Backfill moderation states for existing replies (using the < 2000000 ID range reserved for backfills)
    op.execute("""
        INSERT INTO moderation_states (id, object_type, object_id, visibility)
        SELECT
            (SELECT COALESCE(MAX(id), 0) FROM moderation_states WHERE id < 2000000) + ROW_NUMBER() OVER (ORDER BY id),
            'reply',
            id,
            'visible'
        FROM replies
    """)
    op.execute("""
        INSERT INTO moderation_log (id, moderation_state_id, action, moderator_user_id, new_visibility, reason)
        SELECT
            (SELECT GREATEST(
                COALESCE((SELECT MAX(id) FROM moderation_states WHERE id < 2000000), 0),
                COALESCE((SELECT MAX(id) FROM moderation_log WHERE id < 2000000), 0)
            )) + ROW_NUMBER() OVER (ORDER BY r.id),
            ms.id,
            'create',
            r.author_user_id,
            'visible',
            'Migration: existing reply'
        FROM moderation_states ms
        JOIN replies r ON ms.object_id = r.id AND ms.object_type = 'reply'
    """)
    op.execute("""
        UPDATE replies
        SET moderation_state_id = moderation_states.id
        FROM moderation_states
        WHERE moderation_states.object_type = 'reply'
        AND moderation_states.object_id = replies.id
    """)

    # Now enforce NOT NULL and add the index + FK constraints.
    op.alter_column("comments", "moderation_state_id", nullable=False)
    op.create_index(op.f("ix_comments_moderation_state_id"), "comments", ["moderation_state_id"], unique=False)
    op.create_foreign_key(
        op.f("fk_comments_moderation_state_id_moderation_states"),
        "comments",
        "moderation_states",
        ["moderation_state_id"],
        ["id"],
    )

    op.alter_column("replies", "moderation_state_id", nullable=False)
    op.create_index(op.f("ix_replies_moderation_state_id"), "replies", ["moderation_state_id"], unique=False)
    op.create_foreign_key(
        op.f("fk_replies_moderation_state_id_moderation_states"),
        "replies",
        "moderation_states",
        ["moderation_state_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(op.f("fk_replies_moderation_state_id_moderation_states"), "replies", type_="foreignkey")
    op.drop_index(op.f("ix_replies_moderation_state_id"), table_name="replies")
    op.drop_column("replies", "moderation_state_id")
    op.drop_constraint(op.f("fk_comments_moderation_state_id_moderation_states"), "comments", type_="foreignkey")
    op.drop_index(op.f("ix_comments_moderation_state_id"), table_name="comments")
    op.drop_column("comments", "moderation_state_id")

    # Clean up moderation data for comments and replies.
    op.execute("""
        DELETE FROM moderation_log
        WHERE moderation_state_id IN (
            SELECT id FROM moderation_states WHERE object_type IN ('comment', 'reply')
        )
    """)
    op.execute("DELETE FROM moderation_states WHERE object_type IN ('comment', 'reply')")

    # Note: we cannot remove enum values in PostgreSQL easily, so we leave 'comment'/'reply'
    # in the moderationobjecttype enum.
