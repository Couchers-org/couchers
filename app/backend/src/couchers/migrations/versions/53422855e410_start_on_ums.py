"""Start on UMS

Revision ID: 53422855e410
Revises: 24c22be0362c
Create Date: 2025-11-15 17:20:42.806286

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "53422855e410"
down_revision = "24c22be0362c"
branch_labels = None
depends_on = None

# Backfill starts at 1M, sequence starts at 2M for new items
# Each backfill step queries the current max ID and continues from there
BACKFILL_START = 1_000_000


def upgrade() -> None:
    op.execute("CREATE SEQUENCE moderation_seq START WITH 2000000")
    op.create_table(
        "moderation_states",
        sa.Column("id", sa.BigInteger(), server_default=sa.text("nextval('moderation_seq')"), nullable=False),
        sa.Column("object_type", sa.Enum("HOST_REQUEST", "GROUP_CHAT", name="moderationobjecttype"), nullable=False),
        sa.Column("object_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "visibility",
            sa.Enum("HIDDEN", "SHADOWED", "UNLISTED", "VISIBLE", name="moderationvisibility"),
            nullable=False,
        ),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_moderation_states")),
    )
    op.create_index("ix_moderation_states_object", "moderation_states", ["object_type", "object_id"], unique=True)
    op.create_index("ix_moderation_states_id_visibility", "moderation_states", ["id", "visibility"], unique=False)
    op.create_table(
        "moderation_log",
        sa.Column("id", sa.BigInteger(), server_default=sa.text("nextval('moderation_seq')"), nullable=False),
        sa.Column("moderation_state_id", sa.BigInteger(), nullable=False),
        sa.Column("time", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column(
            "action",
            sa.Enum("CREATE", "APPROVE", "HIDE", "FLAG", "UNFLAG", name="moderationaction"),
            nullable=False,
        ),
        sa.Column("moderator_user_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "new_visibility",
            sa.Enum("HIDDEN", "SHADOWED", "UNLISTED", "VISIBLE", name="moderationvisibility"),
            nullable=True,
        ),
        sa.Column("reason", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(
            ["moderation_state_id"],
            ["moderation_states.id"],
            name=op.f("fk_moderation_log_moderation_state_id_moderation_states"),
        ),
        sa.ForeignKeyConstraint(
            ["moderator_user_id"], ["users.id"], name=op.f("fk_moderation_log_moderator_user_id_users")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_moderation_log")),
    )
    op.create_index(
        op.f("ix_moderation_log_moderation_state_id"), "moderation_log", ["moderation_state_id"], unique=False
    )
    op.create_index(
        "ix_moderation_log_state_time",
        "moderation_log",
        ["moderation_state_id", sa.literal_column("time DESC")],
        unique=False,
    )
    op.create_table(
        "moderation_queue",
        sa.Column("id", sa.BigInteger(), server_default=sa.text("nextval('moderation_seq')"), nullable=False),
        sa.Column("moderation_state_id", sa.BigInteger(), nullable=False),
        sa.Column("time_created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column(
            "trigger",
            sa.Enum("INITIAL_REVIEW", "USER_FLAG", "MACHINE_FLAG", "MODERATOR_REVIEW", name="moderationtrigger"),
            nullable=False,
        ),
        sa.Column("reason", sa.String(), nullable=False),
        sa.Column("resolved_by_log_id", sa.BigInteger(), nullable=True),
        sa.Column("item_author_user_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(
            ["item_author_user_id"], ["users.id"], name=op.f("fk_moderation_queue_item_author_user_id_users")
        ),
        sa.ForeignKeyConstraint(
            ["moderation_state_id"],
            ["moderation_states.id"],
            name=op.f("fk_moderation_queue_moderation_state_id_moderation_states"),
        ),
        sa.ForeignKeyConstraint(
            ["resolved_by_log_id"],
            ["moderation_log.id"],
            name=op.f("fk_moderation_queue_resolved_by_log_id_moderation_log"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_moderation_queue")),
    )
    op.create_index(
        op.f("ix_moderation_queue_item_author_user_id"), "moderation_queue", ["item_author_user_id"], unique=False
    )
    op.create_index(
        op.f("ix_moderation_queue_moderation_state_id"), "moderation_queue", ["moderation_state_id"], unique=False
    )
    op.create_index(
        op.f("ix_moderation_queue_resolved_by_log_id"), "moderation_queue", ["resolved_by_log_id"], unique=False
    )
    op.create_index(
        "ix_moderation_queue_unresolved",
        "moderation_queue",
        ["moderation_state_id", "time_created"],
        unique=False,
        postgresql_where=sa.text("resolved_by_log_id IS NULL"),
    )

    # ==========================================================================
    # BACKFILL HOST REQUESTS
    # ==========================================================================
    # Add moderation_state_id column as nullable first
    op.add_column("host_requests", sa.Column("moderation_state_id", sa.BigInteger(), nullable=True))

    # Create moderation states for all existing host requests with explicit IDs
    op.execute(f"""
        INSERT INTO moderation_states (id, object_type, object_id, visibility)
        SELECT
            {BACKFILL_START} + ROW_NUMBER() OVER (ORDER BY id) - 1,
            'HOST_REQUEST',
            id,
            'VISIBLE'
        FROM host_requests
    """)

    # Create log entries for existing host requests
    # The moderator_user_id is the surfer who created the request
    # Start from max existing ID + 1
    op.execute("""
        INSERT INTO moderation_log (id, moderation_state_id, action, moderator_user_id, new_visibility, reason)
        SELECT
            (SELECT COALESCE(MAX(id), 0) FROM moderation_states WHERE id < 2000000) + ROW_NUMBER() OVER (ORDER BY hr.id),
            ms.id,
            'CREATE',
            hr.surfer_user_id,
            'VISIBLE',
            'Migration: existing host request'
        FROM moderation_states ms
        JOIN host_requests hr ON ms.object_id = hr.id AND ms.object_type = 'HOST_REQUEST'
    """)

    # Update host_requests to link to their moderation states
    op.execute("""
        UPDATE host_requests
        SET moderation_state_id = moderation_states.id
        FROM moderation_states
        WHERE moderation_states.object_type = 'HOST_REQUEST'
        AND moderation_states.object_id = host_requests.id
    """)

    # Now make the column non-nullable
    op.alter_column("host_requests", "moderation_state_id", nullable=False)

    op.create_index(
        op.f("ix_host_requests_moderation_state_id"), "host_requests", ["moderation_state_id"], unique=False
    )
    op.create_foreign_key(
        op.f("fk_host_requests_moderation_state_id_moderation_states"),
        "host_requests",
        "moderation_states",
        ["moderation_state_id"],
        ["id"],
    )

    # ==========================================================================
    # BACKFILL GROUP CHATS
    # ==========================================================================
    # Add moderation_state_id column as nullable first
    op.add_column("group_chats", sa.Column("moderation_state_id", sa.BigInteger(), nullable=True))

    # Create moderation states for all existing group chats with explicit IDs
    # Start from max existing ID + 1
    op.execute("""
        INSERT INTO moderation_states (id, object_type, object_id, visibility)
        SELECT
            (SELECT COALESCE(MAX(id), 0) FROM moderation_states WHERE id < 2000000) + ROW_NUMBER() OVER (ORDER BY id),
            'GROUP_CHAT',
            id,
            'VISIBLE'
        FROM group_chats
    """)

    # Create log entries for existing group chats
    # The moderator_user_id is the creator of the group chat
    # Start from max existing ID + 1 (considering both tables share the ID space)
    op.execute("""
        INSERT INTO moderation_log (id, moderation_state_id, action, moderator_user_id, new_visibility, reason)
        SELECT
            (SELECT GREATEST(
                COALESCE((SELECT MAX(id) FROM moderation_states WHERE id < 2000000), 0),
                COALESCE((SELECT MAX(id) FROM moderation_log WHERE id < 2000000), 0)
            )) + ROW_NUMBER() OVER (ORDER BY gc.id),
            ms.id,
            'CREATE',
            gc.creator_id,
            'VISIBLE',
            'Migration: existing group chat'
        FROM moderation_states ms
        JOIN group_chats gc ON ms.object_id = gc.id AND ms.object_type = 'GROUP_CHAT'
    """)

    # Update group_chats to link to their moderation states
    op.execute("""
        UPDATE group_chats
        SET moderation_state_id = moderation_states.id
        FROM moderation_states
        WHERE moderation_states.object_type = 'GROUP_CHAT'
        AND moderation_states.object_id = group_chats.id
    """)

    # Now make the column non-nullable
    op.alter_column("group_chats", "moderation_state_id", nullable=False)

    op.create_index(op.f("ix_group_chats_moderation_state_id"), "group_chats", ["moderation_state_id"], unique=False)
    op.create_foreign_key(
        op.f("fk_group_chats_moderation_state_id_moderation_states"),
        "group_chats",
        "moderation_states",
        ["moderation_state_id"],
        ["id"],
    )

    # ==========================================================================
    # ADD MODERATION_STATE_ID TO NOTIFICATIONS
    # ==========================================================================
    # This links notifications to moderated content so delivery can be deferred
    # until content is approved (VISIBLE/UNLISTED)
    op.add_column(
        "notifications",
        sa.Column("moderation_state_id", sa.BigInteger(), nullable=True),
    )
    op.create_index(
        op.f("ix_notifications_moderation_state_id"),
        "notifications",
        ["moderation_state_id"],
        unique=False,
    )
    op.create_foreign_key(
        op.f("fk_notifications_moderation_state_id_moderation_states"),
        "notifications",
        "moderation_states",
        ["moderation_state_id"],
        ["id"],
    )


def downgrade() -> None:
    # Drop notifications foreign key and column
    op.drop_constraint(
        op.f("fk_notifications_moderation_state_id_moderation_states"),
        "notifications",
        type_="foreignkey",
    )
    op.drop_index(op.f("ix_notifications_moderation_state_id"), table_name="notifications")
    op.drop_column("notifications", "moderation_state_id")

    # Drop group_chats foreign key and column
    op.drop_constraint(op.f("fk_group_chats_moderation_state_id_moderation_states"), "group_chats", type_="foreignkey")
    op.drop_index(op.f("ix_group_chats_moderation_state_id"), table_name="group_chats")
    op.drop_column("group_chats", "moderation_state_id")

    # Drop host_requests foreign key and column
    op.drop_constraint(
        op.f("fk_host_requests_moderation_state_id_moderation_states"), "host_requests", type_="foreignkey"
    )
    op.drop_index(op.f("ix_host_requests_moderation_state_id"), table_name="host_requests")
    op.drop_column("host_requests", "moderation_state_id")

    # Drop moderation tables
    op.drop_index(
        "ix_moderation_queue_unresolved",
        table_name="moderation_queue",
        postgresql_where=sa.text("resolved_by_log_id IS NULL"),
    )
    op.drop_index(op.f("ix_moderation_queue_resolved_by_log_id"), table_name="moderation_queue")
    op.drop_index(op.f("ix_moderation_queue_moderation_state_id"), table_name="moderation_queue")
    op.drop_index(op.f("ix_moderation_queue_item_author_user_id"), table_name="moderation_queue")
    op.drop_table("moderation_queue")
    op.drop_index("ix_moderation_log_state_time", table_name="moderation_log")
    op.drop_index(op.f("ix_moderation_log_moderation_state_id"), table_name="moderation_log")
    op.drop_table("moderation_log")
    op.drop_index("ix_moderation_states_id_visibility", table_name="moderation_states")
    op.drop_index("ix_moderation_states_object", table_name="moderation_states")
    op.drop_table("moderation_states")
    op.execute("DROP SEQUENCE IF EXISTS moderation_seq")
