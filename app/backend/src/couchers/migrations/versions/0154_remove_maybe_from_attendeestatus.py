"""Events: Remove maybe from AttendeeStatus enum

Revision ID: 0154
Revises: 0153
Create Date: 2026-05-17

"""

from alembic import op

revision = "0154"
down_revision = "0153"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE attendeestatus RENAME TO attendeestatus_old")
    op.execute("CREATE TYPE attendeestatus AS ENUM ('going')")
    op.execute("""
        ALTER TABLE event_occurrence_attendees
        ALTER COLUMN attendee_status TYPE attendeestatus
        USING attendee_status::text::attendeestatus
    """)
    op.execute("DROP TYPE attendeestatus_old")


def downgrade() -> None:
    op.execute("ALTER TYPE attendeestatus RENAME TO attendeestatus_old")
    op.execute("CREATE TYPE attendeestatus AS ENUM ('going', 'maybe')")
    op.execute("""
        ALTER TABLE event_occurrence_attendees
        ALTER COLUMN attendee_status TYPE attendeestatus
        USING attendee_status::text::attendeestatus
    """)
    op.execute("DROP TYPE attendeestatus_old")
