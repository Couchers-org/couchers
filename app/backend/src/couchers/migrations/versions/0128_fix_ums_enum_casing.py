"""Fix UMS enum casing

Revision ID: 0128
Revises: 0127
Create Date: 2026-02-04 00:19:26.124242

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0128"
down_revision = "0127"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Convert all moderation enums from UPPERCASE to lowercase values
    # Pattern: rename old type -> create new type -> alter columns with LOWER() in USING -> drop old type
    # The USING clause handles the data conversion during the type change

    # =========================================================================
    # moderationvisibility: HIDDEN, SHADOWED, UNLISTED, VISIBLE -> lowercase
    # Used in: moderation_states.visibility, moderation_log.new_visibility
    # =========================================================================
    op.execute("ALTER TYPE moderationvisibility RENAME TO moderationvisibility_old")
    op.execute("CREATE TYPE moderationvisibility AS ENUM ('hidden', 'shadowed', 'unlisted', 'visible')")
    op.execute("""
        ALTER TABLE moderation_states
        ALTER COLUMN visibility TYPE moderationvisibility
        USING LOWER(visibility::text)::moderationvisibility
    """)
    op.execute("""
        ALTER TABLE moderation_log
        ALTER COLUMN new_visibility TYPE moderationvisibility
        USING LOWER(new_visibility::text)::moderationvisibility
    """)
    op.execute("DROP TYPE moderationvisibility_old")

    # =========================================================================
    # moderationtrigger: INITIAL_REVIEW, USER_FLAG, MACHINE_FLAG, MODERATOR_REVIEW -> lowercase
    # Used in: moderation_queue.trigger
    # =========================================================================
    op.execute("ALTER TYPE moderationtrigger RENAME TO moderationtrigger_old")
    op.execute(
        "CREATE TYPE moderationtrigger AS ENUM ('initial_review', 'user_flag', 'machine_flag', 'moderator_review')"
    )
    op.execute("""
        ALTER TABLE moderation_queue
        ALTER COLUMN trigger TYPE moderationtrigger
        USING LOWER(trigger::text)::moderationtrigger
    """)
    op.execute("DROP TYPE moderationtrigger_old")

    # =========================================================================
    # moderationaction: CREATE, APPROVE, HIDE, FLAG, UNFLAG -> lowercase
    # Used in: moderation_log.action
    # =========================================================================
    op.execute("ALTER TYPE moderationaction RENAME TO moderationaction_old")
    op.execute("CREATE TYPE moderationaction AS ENUM ('create', 'approve', 'hide', 'flag', 'unflag')")
    op.execute("""
        ALTER TABLE moderation_log
        ALTER COLUMN action TYPE moderationaction
        USING LOWER(action::text)::moderationaction
    """)
    op.execute("DROP TYPE moderationaction_old")

    # =========================================================================
    # moderationobjecttype: HOST_REQUEST, GROUP_CHAT -> lowercase
    # Used in: moderation_states.object_type
    # =========================================================================
    op.execute("ALTER TYPE moderationobjecttype RENAME TO moderationobjecttype_old")
    op.execute("CREATE TYPE moderationobjecttype AS ENUM ('host_request', 'group_chat')")
    op.execute("""
        ALTER TABLE moderation_states
        ALTER COLUMN object_type TYPE moderationobjecttype
        USING LOWER(object_type::text)::moderationobjecttype
    """)
    op.execute("DROP TYPE moderationobjecttype_old")


def downgrade() -> None:
    # Reverse: convert lowercase back to UPPERCASE

    # moderationobjecttype
    op.execute("ALTER TYPE moderationobjecttype RENAME TO moderationobjecttype_old")
    op.execute("CREATE TYPE moderationobjecttype AS ENUM ('HOST_REQUEST', 'GROUP_CHAT')")
    op.execute("""
        ALTER TABLE moderation_states
        ALTER COLUMN object_type TYPE moderationobjecttype
        USING UPPER(object_type::text)::moderationobjecttype
    """)
    op.execute("DROP TYPE moderationobjecttype_old")

    # moderationaction
    op.execute("ALTER TYPE moderationaction RENAME TO moderationaction_old")
    op.execute("CREATE TYPE moderationaction AS ENUM ('CREATE', 'APPROVE', 'HIDE', 'FLAG', 'UNFLAG')")
    op.execute("""
        ALTER TABLE moderation_log
        ALTER COLUMN action TYPE moderationaction
        USING UPPER(action::text)::moderationaction
    """)
    op.execute("DROP TYPE moderationaction_old")

    # moderationtrigger
    op.execute("ALTER TYPE moderationtrigger RENAME TO moderationtrigger_old")
    op.execute(
        "CREATE TYPE moderationtrigger AS ENUM ('INITIAL_REVIEW', 'USER_FLAG', 'MACHINE_FLAG', 'MODERATOR_REVIEW')"
    )
    op.execute("""
        ALTER TABLE moderation_queue
        ALTER COLUMN trigger TYPE moderationtrigger
        USING UPPER(trigger::text)::moderationtrigger
    """)
    op.execute("DROP TYPE moderationtrigger_old")

    # moderationvisibility
    op.execute("ALTER TYPE moderationvisibility RENAME TO moderationvisibility_old")
    op.execute("CREATE TYPE moderationvisibility AS ENUM ('HIDDEN', 'SHADOWED', 'UNLISTED', 'VISIBLE')")
    op.execute("""
        ALTER TABLE moderation_states
        ALTER COLUMN visibility TYPE moderationvisibility
        USING UPPER(visibility::text)::moderationvisibility
    """)
    op.execute("""
        ALTER TABLE moderation_log
        ALTER COLUMN new_visibility TYPE moderationvisibility
        USING UPPER(new_visibility::text)::moderationvisibility
    """)
    op.execute("DROP TYPE moderationvisibility_old")
