"""Backend/moderation: UMS coverage for public trips

Revision ID: 0173
Revises: 0172
Create Date: 2026-05-09 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0173"
down_revision = "0172"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add 'public_trip' to the ModerationObjectType enum.
    # Must use rename/recreate pattern instead of ADD VALUE, because ADD VALUE
    # cannot be used in the same transaction as DML that references the new value.
    op.execute("ALTER TYPE moderationobjecttype RENAME TO moderationobjecttype_old")
    op.execute(
        "CREATE TYPE moderationobjecttype AS ENUM "
        "('host_request', 'group_chat', 'friend_request', 'event_occurrence', "
        "'comment', 'reply', 'discussion', 'reference', 'public_trip')"
    )
    op.execute("""
        ALTER TABLE moderation_states
        ALTER COLUMN object_type TYPE moderationobjecttype
        USING object_type::text::moderationobjecttype
    """)
    op.execute("DROP TYPE moderationobjecttype_old")

    # Add moderation_state_id column as nullable so we can backfill before enforcing NOT NULL.
    op.add_column("public_trips", sa.Column("moderation_state_id", sa.BigInteger(), nullable=True))

    # Backfill: create a ModerationState and a 'create' ModerationLog entry attributed to the
    # author for every existing public trip. Existing trips are pre-approved at 'visible' (no
    # ModerationQueueItem rows for historical content). Backfilled IDs use the < 2_000_000 range;
    # the sequence (starting at 2_000_000) supplies IDs for new rows.
    op.execute("""
        INSERT INTO moderation_states (id, object_type, object_id, visibility)
        SELECT
            (SELECT COALESCE(MAX(id), 0) FROM moderation_states WHERE id < 2000000) + ROW_NUMBER() OVER (ORDER BY id),
            'public_trip',
            id,
            'visible'::moderationvisibility
        FROM public_trips
    """)
    op.execute("""
        INSERT INTO moderation_log (id, moderation_state_id, action, moderator_user_id, new_visibility, reason)
        SELECT
            (SELECT GREATEST(
                COALESCE((SELECT MAX(id) FROM moderation_states WHERE id < 2000000), 0),
                COALESCE((SELECT MAX(id) FROM moderation_log WHERE id < 2000000), 0)
            )) + ROW_NUMBER() OVER (ORDER BY pt.id),
            ms.id,
            'create',
            pt.user_id,
            'visible'::moderationvisibility,
            'Migration: existing public trip'
        FROM moderation_states ms
        JOIN public_trips pt ON ms.object_id = pt.id AND ms.object_type = 'public_trip'
    """)
    op.execute("""
        UPDATE public_trips
        SET moderation_state_id = moderation_states.id
        FROM moderation_states
        WHERE moderation_states.object_type = 'public_trip'
        AND moderation_states.object_id = public_trips.id
    """)

    # Now enforce NOT NULL and add the index + FK constraints.
    op.alter_column("public_trips", "moderation_state_id", nullable=False)
    op.create_index(op.f("ix_public_trips_moderation_state_id"), "public_trips", ["moderation_state_id"], unique=False)
    op.create_foreign_key(
        op.f("fk_public_trips_moderation_state_id_moderation_states"),
        "public_trips",
        "moderation_states",
        ["moderation_state_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        op.f("fk_public_trips_moderation_state_id_moderation_states"), "public_trips", type_="foreignkey"
    )
    op.drop_index(op.f("ix_public_trips_moderation_state_id"), table_name="public_trips")
    op.drop_column("public_trips", "moderation_state_id")

    # Clean up moderation data for public trips.
    op.execute("""
        DELETE FROM moderation_log
        WHERE moderation_state_id IN (
            SELECT id FROM moderation_states WHERE object_type = 'public_trip'
        )
    """)
    op.execute("DELETE FROM moderation_states WHERE object_type = 'public_trip'")

    # Note: we cannot remove enum values in PostgreSQL easily, so we leave 'public_trip'
    # in the moderationobjecttype enum.
