"""Backend/moderation: UMS coverage for thread comments and replies

Revision ID: 0149
Revises: 0148
Create Date: 2026-05-10 00:57:29.125757

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0149"
down_revision = "0148"
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

    # Backfill: for every existing comment, create a ModerationState (visible) and a 'create'
    # ModerationLog entry attributed to the author. Existing content was visible before this
    # migration, so we keep it visible — only new content (created via create_moderation) starts
    # shadowed. We intentionally do NOT enqueue ModerationQueueItem rows for historical content
    # to avoid flooding the moderation queue.
    op.execute("""
        WITH new_states AS (
            INSERT INTO moderation_states (id, object_type, object_id, visibility)
            SELECT nextval('moderation_seq'), 'comment', id, 'visible'
            FROM comments
            ORDER BY id
            RETURNING id, object_id
        )
        UPDATE comments
        SET moderation_state_id = new_states.id
        FROM new_states
        WHERE comments.id = new_states.object_id
    """)
    op.execute("""
        INSERT INTO moderation_log (id, moderation_state_id, action, moderator_user_id, new_visibility, reason)
        SELECT nextval('moderation_seq'), c.moderation_state_id, 'create', c.author_user_id, 'visible',
               'Migration: existing comment'
        FROM comments c
    """)

    op.execute("""
        WITH new_states AS (
            INSERT INTO moderation_states (id, object_type, object_id, visibility)
            SELECT nextval('moderation_seq'), 'reply', id, 'visible'
            FROM replies
            ORDER BY id
            RETURNING id, object_id
        )
        UPDATE replies
        SET moderation_state_id = new_states.id
        FROM new_states
        WHERE replies.id = new_states.object_id
    """)
    op.execute("""
        INSERT INTO moderation_log (id, moderation_state_id, action, moderator_user_id, new_visibility, reason)
        SELECT nextval('moderation_seq'), r.moderation_state_id, 'create', r.author_user_id, 'visible',
               'Migration: existing reply'
        FROM replies r
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
