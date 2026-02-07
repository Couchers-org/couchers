"""Implement UMS for events

Revision ID: a3b1c2d3e4f5
Revises: 8191f466c673
Create Date: 2026-02-07 10:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a3b1c2d3e4f5"
down_revision = "8191f466c673"
branch_labels = None
depends_on = None


def upgrade():
    # Add event to the ModerationObjectType enum
    op.execute("ALTER TYPE moderationobjecttype ADD VALUE IF NOT EXISTS 'event'")

    # Add moderation_state_id column as nullable first
    op.add_column("events", sa.Column("moderation_state_id", sa.BigInteger(), nullable=True))

    # Create moderation states for all existing events with explicit IDs
    op.execute("""
        INSERT INTO moderation_states (id, object_type, object_id, visibility)
        SELECT
            (SELECT COALESCE(MAX(id), 0) FROM moderation_states WHERE id < 2000000) + ROW_NUMBER() OVER (ORDER BY id),
            'event',
            id,
            'visible'
        FROM events
    """)

    # Create log entries for existing events
    # The moderator_user_id is the creator_user who created the event
    op.execute("""
        INSERT INTO moderation_log (id, moderation_state_id, action, moderator_user_id, new_visibility, reason)
        SELECT
            (SELECT GREATEST(
                COALESCE((SELECT MAX(id) FROM moderation_states WHERE id < 2000000), 0),
                COALESCE((SELECT MAX(id) FROM moderation_log WHERE id < 2000000), 0)
            )) + ROW_NUMBER() OVER (ORDER BY e.id),
            ms.id,
            'create',
            e.creator_user_id,
            'visible',
            'Migration: existing event'
        FROM moderation_states ms
        JOIN events e ON ms.object_id = e.id AND ms.object_type = 'event'
    """)

    # Update events to link to their moderation states
    op.execute("""
        UPDATE events
        SET moderation_state_id = moderation_states.id
        FROM moderation_states
        WHERE moderation_states.object_type = 'event'
        AND moderation_states.object_id = events.id
    """)

    # Now make the column non-nullable
    op.alter_column("events", "moderation_state_id", nullable=False)

    op.create_index(
        op.f("ix_events_moderation_state_id"),
        "events",
        ["moderation_state_id"],
        unique=False,
    )
    op.create_foreign_key(
        op.f("fk_events_moderation_state_id_moderation_states"),
        "events",
        "moderation_states",
        ["moderation_state_id"],
        ["id"],
    )


def downgrade():
    # Drop events foreign key and column
    op.drop_constraint(
        op.f("fk_events_moderation_state_id_moderation_states"),
        "events",
        type_="foreignkey",
    )
    op.drop_index(op.f("ix_events_moderation_state_id"), table_name="events")
    op.drop_column("events", "moderation_state_id")

    # Clean up moderation data for events
    op.execute("""
        DELETE FROM moderation_log
        WHERE moderation_state_id IN (
            SELECT id FROM moderation_states WHERE object_type = 'event'
        )
    """)
    op.execute("DELETE FROM moderation_states WHERE object_type = 'event'")

    # Note: We cannot remove enum values in PostgreSQL easily, so we leave event in the enum
