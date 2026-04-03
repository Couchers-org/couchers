"""Rename host_request user columns to initiator/recipient

Revision ID: 0140
Revises: 0139
Create Date: 2026-01-25 12:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0140"
down_revision = "0139"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Rename user ID columns
    op.alter_column("host_requests", "surfer_user_id", new_column_name="initiator_user_id")
    op.alter_column("host_requests", "host_user_id", new_column_name="recipient_user_id")

    # Rename other host/surfer columns
    op.alter_column("host_requests", "is_host_archived", new_column_name="is_recipient_archived")
    op.alter_column("host_requests", "is_surfer_archived", new_column_name="is_initiator_archived")
    op.alter_column("host_requests", "host_last_seen_message_id", new_column_name="recipient_last_seen_message_id")
    op.alter_column("host_requests", "surfer_last_seen_message_id", new_column_name="initiator_last_seen_message_id")
    op.alter_column(
        "host_requests", "host_sent_reference_reminders", new_column_name="recipient_sent_reference_reminders"
    )
    op.alter_column(
        "host_requests", "surfer_sent_reference_reminders", new_column_name="initiator_sent_reference_reminders"
    )
    op.alter_column("host_requests", "host_sent_request_reminders", new_column_name="recipient_sent_request_reminders")
    op.alter_column("host_requests", "host_reason_didnt_meetup", new_column_name="recipient_reason_didnt_meetup")
    op.alter_column("host_requests", "surfer_reason_didnt_meetup", new_column_name="initiator_reason_didnt_meetup")

    # Rename constraints
    op.execute(
        "ALTER TABLE host_requests RENAME CONSTRAINT fk_host_requests_surfer_user_id_users "
        "TO fk_host_requests_initiator_user_id_users"
    )
    op.execute(
        "ALTER TABLE host_requests RENAME CONSTRAINT fk_host_requests_host_user_id_users "
        "TO fk_host_requests_recipient_user_id_users"
    )

    # Rename indexes
    op.execute("ALTER INDEX ix_host_requests_surfer_user_id RENAME TO ix_host_requests_initiator_user_id")
    op.execute("ALTER INDEX ix_host_requests_host_user_id RENAME TO ix_host_requests_recipient_user_id")
    op.execute("ALTER INDEX ix_host_requests_host_didnt_meetup RENAME TO ix_host_requests_recipient_didnt_meetup")
    op.execute("ALTER INDEX ix_host_requests_surfer_didnt_meetup RENAME TO ix_host_requests_initiator_didnt_meetup")


def downgrade() -> None:
    # Rename indexes back
    op.execute("ALTER INDEX ix_host_requests_initiator_didnt_meetup RENAME TO ix_host_requests_surfer_didnt_meetup")
    op.execute("ALTER INDEX ix_host_requests_recipient_didnt_meetup RENAME TO ix_host_requests_host_didnt_meetup")
    op.execute("ALTER INDEX ix_host_requests_recipient_user_id RENAME TO ix_host_requests_host_user_id")
    op.execute("ALTER INDEX ix_host_requests_initiator_user_id RENAME TO ix_host_requests_surfer_user_id")

    # Rename constraints back
    op.execute(
        "ALTER TABLE host_requests RENAME CONSTRAINT fk_host_requests_recipient_user_id_users "
        "TO fk_host_requests_host_user_id_users"
    )
    op.execute(
        "ALTER TABLE host_requests RENAME CONSTRAINT fk_host_requests_initiator_user_id_users "
        "TO fk_host_requests_surfer_user_id_users"
    )

    # Rename other columns back
    op.alter_column("host_requests", "initiator_reason_didnt_meetup", new_column_name="surfer_reason_didnt_meetup")
    op.alter_column("host_requests", "recipient_reason_didnt_meetup", new_column_name="host_reason_didnt_meetup")
    op.alter_column("host_requests", "recipient_sent_request_reminders", new_column_name="host_sent_request_reminders")
    op.alter_column(
        "host_requests", "initiator_sent_reference_reminders", new_column_name="surfer_sent_reference_reminders"
    )
    op.alter_column(
        "host_requests", "recipient_sent_reference_reminders", new_column_name="host_sent_reference_reminders"
    )
    op.alter_column("host_requests", "initiator_last_seen_message_id", new_column_name="surfer_last_seen_message_id")
    op.alter_column("host_requests", "recipient_last_seen_message_id", new_column_name="host_last_seen_message_id")
    op.alter_column("host_requests", "is_initiator_archived", new_column_name="is_surfer_archived")
    op.alter_column("host_requests", "is_recipient_archived", new_column_name="is_host_archived")

    # Rename user ID columns back
    op.alter_column("host_requests", "recipient_user_id", new_column_name="host_user_id")
    op.alter_column("host_requests", "initiator_user_id", new_column_name="surfer_user_id")
