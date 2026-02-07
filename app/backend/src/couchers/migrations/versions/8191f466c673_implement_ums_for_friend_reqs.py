"""Implement UMS for friend reqs

Revision ID: 8191f466c673
Revises: 5c0e25460ac2
Create Date: 2025-12-23 10:51:21.670999

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "8191f466c673"
down_revision = "5c0e25460ac2"
branch_labels = None
depends_on = None


def upgrade():
    # Add friend_request to the ModerationObjectType enum
    op.execute("ALTER TYPE moderationobjecttype ADD VALUE IF NOT EXISTS 'friend_request'")

    # Add moderation_state_id column as nullable first
    op.add_column("friend_relationships", sa.Column("moderation_state_id", sa.BigInteger(), nullable=True))

    # Create moderation states for all existing friend relationships with explicit IDs
    # Start from max existing ID + 1 in the backfill range (< 2000000)
    op.execute("""
        INSERT INTO moderation_states (id, object_type, object_id, visibility)
        SELECT
            (SELECT COALESCE(MAX(id), 0) FROM moderation_states WHERE id < 2000000) + ROW_NUMBER() OVER (ORDER BY id),
            'friend_request',
            id,
            'visible'
        FROM friend_relationships
    """)

    # Create log entries for existing friend relationships
    # The moderator_user_id is the from_user who sent the friend request
    op.execute("""
        INSERT INTO moderation_log (id, moderation_state_id, action, moderator_user_id, new_visibility, reason)
        SELECT
            (SELECT GREATEST(
                COALESCE((SELECT MAX(id) FROM moderation_states WHERE id < 2000000), 0),
                COALESCE((SELECT MAX(id) FROM moderation_log WHERE id < 2000000), 0)
            )) + ROW_NUMBER() OVER (ORDER BY fr.id),
            ms.id,
            'create',
            fr.from_user_id,
            'visible',
            'Migration: existing friend relationship'
        FROM moderation_states ms
        JOIN friend_relationships fr ON ms.object_id = fr.id AND ms.object_type = 'friend_request'
    """)

    # Update friend_relationships to link to their moderation states
    op.execute("""
        UPDATE friend_relationships
        SET moderation_state_id = moderation_states.id
        FROM moderation_states
        WHERE moderation_states.object_type = 'friend_request'
        AND moderation_states.object_id = friend_relationships.id
    """)

    # Now make the column non-nullable
    op.alter_column("friend_relationships", "moderation_state_id", nullable=False)

    op.create_index(
        op.f("ix_friend_relationships_moderation_state_id"),
        "friend_relationships",
        ["moderation_state_id"],
        unique=False,
    )
    op.create_foreign_key(
        op.f("fk_friend_relationships_moderation_state_id_moderation_states"),
        "friend_relationships",
        "moderation_states",
        ["moderation_state_id"],
        ["id"],
    )


def downgrade():
    # Drop friend_relationships foreign key and column
    op.drop_constraint(
        op.f("fk_friend_relationships_moderation_state_id_moderation_states"),
        "friend_relationships",
        type_="foreignkey",
    )
    op.drop_index(op.f("ix_friend_relationships_moderation_state_id"), table_name="friend_relationships")
    op.drop_column("friend_relationships", "moderation_state_id")

    # Clean up moderation data for friend requests
    op.execute("""
        DELETE FROM moderation_log
        WHERE moderation_state_id IN (
            SELECT id FROM moderation_states WHERE object_type = 'friend_request'
        )
    """)
    op.execute("DELETE FROM moderation_states WHERE object_type = 'friend_request'")

    # Note: We cannot remove enum values in PostgreSQL easily, so we leave friend_request in the enum
