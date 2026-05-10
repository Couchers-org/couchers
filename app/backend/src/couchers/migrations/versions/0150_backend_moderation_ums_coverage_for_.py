"""Backend/moderation: UMS coverage for discussions

Revision ID: 0150
Revises: 0149
Create Date: 2026-05-10 01:23:40.985349

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0150"
down_revision = "0149"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add 'discussion' to the ModerationObjectType enum.
    # Must use rename/recreate pattern instead of ADD VALUE, because ADD VALUE
    # cannot be used in the same transaction as DML that references the new value.
    op.execute("ALTER TYPE moderationobjecttype RENAME TO moderationobjecttype_old")
    op.execute(
        "CREATE TYPE moderationobjecttype AS ENUM "
        "('host_request', 'group_chat', 'friend_request', 'event_occurrence', 'comment', 'reply', 'discussion')"
    )
    op.execute("""
        ALTER TABLE moderation_states
        ALTER COLUMN object_type TYPE moderationobjecttype
        USING object_type::text::moderationobjecttype
    """)
    op.execute("DROP TYPE moderationobjecttype_old")

    # Add moderation_state_id column as nullable so we can backfill before enforcing NOT NULL.
    op.add_column("discussions", sa.Column("moderation_state_id", sa.BigInteger(), nullable=True))

    # Backfill: create a ModerationState (visible) and a 'create' ModerationLog entry attributed
    # to the creator for every existing discussion. Existing content was visible before this
    # migration, so we keep it visible — only new content (created via create_moderation) starts
    # shadowed. We intentionally do NOT enqueue ModerationQueueItem rows for historical content
    # to avoid flooding the moderation queue. Backfilled IDs use the < 2_000_000 range; the
    # sequence (starting at 2_000_000) supplies IDs for new rows.
    op.execute("""
        INSERT INTO moderation_states (id, object_type, object_id, visibility)
        SELECT
            (SELECT COALESCE(MAX(id), 0) FROM moderation_states WHERE id < 2000000) + ROW_NUMBER() OVER (ORDER BY id),
            'discussion',
            id,
            'visible'
        FROM discussions
    """)
    op.execute("""
        INSERT INTO moderation_log (id, moderation_state_id, action, moderator_user_id, new_visibility, reason)
        SELECT
            (SELECT GREATEST(
                COALESCE((SELECT MAX(id) FROM moderation_states WHERE id < 2000000), 0),
                COALESCE((SELECT MAX(id) FROM moderation_log WHERE id < 2000000), 0)
            )) + ROW_NUMBER() OVER (ORDER BY d.id),
            ms.id,
            'create',
            d.creator_user_id,
            'visible',
            'Migration: existing discussion'
        FROM moderation_states ms
        JOIN discussions d ON ms.object_id = d.id AND ms.object_type = 'discussion'
    """)
    op.execute("""
        UPDATE discussions
        SET moderation_state_id = moderation_states.id
        FROM moderation_states
        WHERE moderation_states.object_type = 'discussion'
        AND moderation_states.object_id = discussions.id
    """)

    # Now enforce NOT NULL and add the index + FK constraints.
    op.alter_column("discussions", "moderation_state_id", nullable=False)
    op.create_index(op.f("ix_discussions_moderation_state_id"), "discussions", ["moderation_state_id"], unique=False)
    op.create_foreign_key(
        op.f("fk_discussions_moderation_state_id_moderation_states"),
        "discussions",
        "moderation_states",
        ["moderation_state_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(op.f("fk_discussions_moderation_state_id_moderation_states"), "discussions", type_="foreignkey")
    op.drop_index(op.f("ix_discussions_moderation_state_id"), table_name="discussions")
    op.drop_column("discussions", "moderation_state_id")

    # Clean up moderation data for discussions.
    op.execute("""
        DELETE FROM moderation_log
        WHERE moderation_state_id IN (
            SELECT id FROM moderation_states WHERE object_type = 'discussion'
        )
    """)
    op.execute("DELETE FROM moderation_states WHERE object_type = 'discussion'")

    # Note: we cannot remove enum values in PostgreSQL easily, so we leave 'discussion'
    # in the moderationobjecttype enum.
