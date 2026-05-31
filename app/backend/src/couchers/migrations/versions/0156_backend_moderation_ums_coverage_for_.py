"""Backend/moderation: UMS coverage for references

Revision ID: 0156
Revises: 0155
Create Date: 2026-05-10 02:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0156"
down_revision = "0155"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add 'reference' to the ModerationObjectType enum.
    # Must use rename/recreate pattern instead of ADD VALUE, because ADD VALUE
    # cannot be used in the same transaction as DML that references the new value.
    op.execute("ALTER TYPE moderationobjecttype RENAME TO moderationobjecttype_old")
    op.execute(
        "CREATE TYPE moderationobjecttype AS ENUM "
        "('host_request', 'group_chat', 'friend_request', 'event_occurrence', 'comment', 'reply', 'discussion', 'reference')"
    )
    op.execute("""
        ALTER TABLE moderation_states
        ALTER COLUMN object_type TYPE moderationobjecttype
        USING object_type::text::moderationobjecttype
    """)
    op.execute("DROP TYPE moderationobjecttype_old")

    # Add moderation_state_id column as nullable so we can backfill before enforcing NOT NULL.
    op.add_column("references", sa.Column("moderation_state_id", sa.BigInteger(), nullable=True))

    # Backfill: create a ModerationState and a 'create' ModerationLog entry attributed to the
    # author for every existing reference. Pre-existing references with is_deleted=True become
    # 'hidden' so they remain unsurfaced via UMS; everything else becomes 'visible'. We
    # intentionally do NOT enqueue ModerationQueueItem rows for historical content to avoid
    # flooding the moderation queue. Backfilled IDs use the < 2_000_000 range; the sequence
    # (starting at 2_000_000) supplies IDs for new rows.
    op.execute("""
        INSERT INTO moderation_states (id, object_type, object_id, visibility)
        SELECT
            (SELECT COALESCE(MAX(id), 0) FROM moderation_states WHERE id < 2000000) + ROW_NUMBER() OVER (ORDER BY id),
            'reference',
            id,
            CASE WHEN is_deleted THEN 'hidden'::moderationvisibility ELSE 'visible'::moderationvisibility END
        FROM "references"
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
            r.from_user_id,
            CASE WHEN r.is_deleted THEN 'hidden'::moderationvisibility ELSE 'visible'::moderationvisibility END,
            'Migration: existing reference'
        FROM moderation_states ms
        JOIN "references" r ON ms.object_id = r.id AND ms.object_type = 'reference'
    """)
    op.execute("""
        UPDATE "references"
        SET moderation_state_id = moderation_states.id
        FROM moderation_states
        WHERE moderation_states.object_type = 'reference'
        AND moderation_states.object_id = "references".id
    """)

    # Now enforce NOT NULL and add the index + FK constraints.
    op.alter_column("references", "moderation_state_id", nullable=False)
    op.create_index(op.f("ix_references_moderation_state_id"), "references", ["moderation_state_id"], unique=False)
    op.create_foreign_key(
        op.f("fk_references_moderation_state_id_moderation_states"),
        "references",
        "moderation_states",
        ["moderation_state_id"],
        ["id"],
    )

    # The legacy `is_deleted` flag is now subsumed by UMS visibility (deleted rows were
    # backfilled to 'hidden' above). Drop the column.
    op.drop_column("references", "is_deleted")


def downgrade() -> None:
    # Restore the is_deleted column from the moderation visibility before tearing down UMS state.
    op.add_column(
        "references",
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.execute("""
        UPDATE "references"
        SET is_deleted = TRUE
        FROM moderation_states
        WHERE moderation_states.id = "references".moderation_state_id
        AND moderation_states.visibility = 'hidden'
    """)

    op.drop_constraint(op.f("fk_references_moderation_state_id_moderation_states"), "references", type_="foreignkey")
    op.drop_index(op.f("ix_references_moderation_state_id"), table_name="references")
    op.drop_column("references", "moderation_state_id")

    # Clean up moderation data for references.
    op.execute("""
        DELETE FROM moderation_log
        WHERE moderation_state_id IN (
            SELECT id FROM moderation_states WHERE object_type = 'reference'
        )
    """)
    op.execute("DELETE FROM moderation_states WHERE object_type = 'reference'")

    # Note: we cannot remove enum values in PostgreSQL easily, so we leave 'reference'
    # in the moderationobjecttype enum.
