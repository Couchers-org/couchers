"""Implement UMS for events

Revision ID: 738c3c9f922e
Revises: d3189338b8c1
Create Date: 2026-02-07 10:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "738c3c9f922e"
down_revision = "d3189338b8c1"
branch_labels = None
depends_on = None


def upgrade():
    # Add event to the ModerationObjectType enum
    # Add event_occurrence to the ModerationObjectType enum
    # Must use rename/recreate pattern instead of ADD VALUE, because ADD VALUE
    # cannot be used in the same transaction as DML that references the new value
    op.execute("ALTER TYPE moderationobjecttype RENAME TO moderationobjecttype_old")
    op.execute(
        "CREATE TYPE moderationobjecttype AS ENUM ('host_request', 'group_chat', 'friend_request', 'event_occurrence')"
    )
    op.execute("""
        ALTER TABLE moderation_states
        ALTER COLUMN object_type TYPE moderationobjecttype
        USING object_type::text::moderationobjecttype
    """)
    op.execute("DROP TYPE moderationobjecttype_old")

    # Add moderation_state_id column to event_occurrences as nullable first
    op.add_column("event_occurrences", sa.Column("moderation_state_id", sa.BigInteger(), nullable=True))

    # Create moderation states for all existing event occurrences with explicit IDs
    op.execute("""
        INSERT INTO moderation_states (id, object_type, object_id, visibility)
        SELECT
            (SELECT COALESCE(MAX(id), 0) FROM moderation_states WHERE id < 2000000) + ROW_NUMBER() OVER (ORDER BY id),
            'event_occurrence',
            id,
            'visible'
        FROM event_occurrences
    """)

    # Create log entries for existing event occurrences
    # The moderator_user_id is the creator_user who created the occurrence
    op.execute("""
        INSERT INTO moderation_log (id, moderation_state_id, action, moderator_user_id, new_visibility, reason)
        SELECT
            (SELECT GREATEST(
                COALESCE((SELECT MAX(id) FROM moderation_states WHERE id < 2000000), 0),
                COALESCE((SELECT MAX(id) FROM moderation_log WHERE id < 2000000), 0)
            )) + ROW_NUMBER() OVER (ORDER BY eo.id),
            ms.id,
            'create',
            eo.creator_user_id,
            'visible',
            'Migration: existing event occurrence'
        FROM moderation_states ms
        JOIN event_occurrences eo ON ms.object_id = eo.id AND ms.object_type = 'event_occurrence'
    """)

    # Update event_occurrences to link to their moderation states
    op.execute("""
        UPDATE event_occurrences
        SET moderation_state_id = moderation_states.id
        FROM moderation_states
        WHERE moderation_states.object_type = 'event_occurrence'
        AND moderation_states.object_id = event_occurrences.id
    """)

    # Now make the column non-nullable
    op.alter_column("event_occurrences", "moderation_state_id", nullable=False)

    op.create_index(
        op.f("ix_event_occurrences_moderation_state_id"),
        "event_occurrences",
        ["moderation_state_id"],
        unique=False,
    )
    op.create_foreign_key(
        op.f("fk_event_occurrences_moderation_state_id_moderation_states"),
        "event_occurrences",
        "moderation_states",
        ["moderation_state_id"],
        ["id"],
    )


def downgrade():
    # Drop event_occurrences foreign key and column
    op.drop_constraint(
        op.f("fk_event_occurrences_moderation_state_id_moderation_states"),
        "event_occurrences",
        type_="foreignkey",
    )
    op.drop_index(op.f("ix_event_occurrences_moderation_state_id"), table_name="event_occurrences")
    op.drop_column("event_occurrences", "moderation_state_id")

    # Clean up moderation data for events
    op.execute("""
        DELETE FROM moderation_log
        WHERE moderation_state_id IN (
            SELECT id FROM moderation_states WHERE object_type = 'event_occurrence'
        )
    """)
    op.execute("DELETE FROM moderation_states WHERE object_type = 'event_occurrence'")

    # Note: We cannot remove enum values in PostgreSQL easily, so we leave event_occurrence in the enum
