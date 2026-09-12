"""Backend/moderation: moderation states for users

Revision ID: 0181
Revises: 0180
Create Date: 2026-08-15 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0181"
down_revision = "0180"
branch_labels = None
depends_on = None

CONTENT_OBJECT_TYPES = (
    "'host_request', 'group_chat', 'friend_request', 'event_occurrence', "
    "'comment', 'reply', 'discussion', 'reference', 'public_trip'"
)

VISIBILITY_CHECK_NAME = "ck_moderation_states_check_visibility_null_iff_own_mechanism"

# moderation_states, moderation_queue and moderation_log share one sequence, so backfilled IDs
# have to be unique across all three. The sequence starts at 2_000_000 and supplies IDs for new
# rows; backfills take the < 2_000_000 range.
NEXT_BACKFILL_ID = """
    (SELECT GREATEST(
        COALESCE((SELECT MAX(id) FROM moderation_states WHERE id < 2000000), 0),
        COALESCE((SELECT MAX(id) FROM moderation_queue WHERE id < 2000000), 0),
        COALESCE((SELECT MAX(id) FROM moderation_log WHERE id < 2000000), 0)
    ))
"""


def _recreate_object_type_enum(values: str) -> None:
    # Rename/recreate rather than ADD VALUE, because ADD VALUE cannot be used in the same
    # transaction as DML that references the new value.
    op.execute("ALTER TYPE moderationobjecttype RENAME TO moderationobjecttype_old")
    op.execute(f"CREATE TYPE moderationobjecttype AS ENUM ({values})")
    op.execute("""
        ALTER TABLE moderation_states
        ALTER COLUMN object_type TYPE moderationobjecttype
        USING object_type::text::moderationobjecttype
    """)
    op.execute("DROP TYPE moderationobjecttype_old")


def upgrade() -> None:
    _recreate_object_type_enum(f"{CONTENT_OBJECT_TYPES}, 'user'")

    op.alter_column("moderation_states", "visibility", nullable=True)

    op.add_column("users", sa.Column("moderation_state_id", sa.BigInteger(), nullable=True))

    op.execute(f"""
        INSERT INTO moderation_states (id, object_type, object_id, visibility)
        SELECT
            {NEXT_BACKFILL_ID} + ROW_NUMBER() OVER (ORDER BY id),
            'user',
            id,
            NULL
        FROM users
    """)
    op.execute("""
        UPDATE users
        SET moderation_state_id = moderation_states.id
        FROM moderation_states
        WHERE moderation_states.object_type = 'user'
        AND moderation_states.object_id = users.id
    """)
    op.execute(f"""
        INSERT INTO moderation_log (id, moderation_state_id, action, moderator_user_id, new_visibility, reason)
        SELECT
            {NEXT_BACKFILL_ID} + ROW_NUMBER() OVER (ORDER BY id),
            id,
            'create',
            object_id,
            NULL,
            'Migration: existing user'
        FROM moderation_states
        WHERE object_type = 'user'
    """)

    op.alter_column("users", "moderation_state_id", nullable=False)
    op.create_index(op.f("ix_users_moderation_state_id"), "users", ["moderation_state_id"], unique=False)
    op.create_foreign_key(
        op.f("fk_users_moderation_state_id_moderation_states"),
        "users",
        "moderation_states",
        ["moderation_state_id"],
        ["id"],
    )

    op.create_check_constraint(
        op.f(VISIBILITY_CHECK_NAME),
        "moderation_states",
        "(object_type = 'user') = (visibility IS NULL)",
    )


def downgrade() -> None:
    op.drop_constraint(op.f(VISIBILITY_CHECK_NAME), "moderation_states", type_="check")

    op.drop_constraint(op.f("fk_users_moderation_state_id_moderation_states"), "users", type_="foreignkey")
    op.drop_index(op.f("ix_users_moderation_state_id"), table_name="users")
    op.drop_column("users", "moderation_state_id")

    # moderation_log.queue_item_id has to be cleared before the queue items it points at can go
    op.execute("""
        UPDATE moderation_log
        SET queue_item_id = NULL
        WHERE moderation_state_id IN (SELECT id FROM moderation_states WHERE object_type = 'user')
    """)
    op.execute("""
        DELETE FROM moderation_queue
        WHERE moderation_state_id IN (SELECT id FROM moderation_states WHERE object_type = 'user')
    """)
    op.execute("""
        DELETE FROM moderation_log
        WHERE moderation_state_id IN (SELECT id FROM moderation_states WHERE object_type = 'user')
    """)
    op.execute("DELETE FROM moderation_states WHERE object_type = 'user'")

    op.alter_column("moderation_states", "visibility", nullable=False)

    _recreate_object_type_enum(CONTENT_OBJECT_TYPES)
