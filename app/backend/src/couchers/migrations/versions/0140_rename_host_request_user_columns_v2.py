"""Rename host_request user columns to initiator/recipient

Revision ID: 0140
Revises: 0139
Create Date: 2026-01-25 12:00:00.000000

"""

from alembic import op
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = "0140"
down_revision = "0139"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = {col["name"] for col in inspector.get_columns("host_requests")}
    indexes = {idx["name"] for idx in inspector.get_indexes("host_requests")}

    # Helper to rename column only if old name exists
    def rename_column(old_name, new_name):
        if old_name in columns:
            op.alter_column("host_requests", old_name, new_column_name=new_name)

    # Helper to rename index only if old name exists
    def rename_index(old_name, new_name):
        if old_name in indexes:
            op.execute(f"ALTER INDEX {old_name} RENAME TO {new_name}")

    # Rename user ID columns
    rename_column("surfer_user_id", "initiator_user_id")
    rename_column("host_user_id", "recipient_user_id")

    # Rename other host/surfer columns
    rename_column("is_host_archived", "is_recipient_archived")
    rename_column("is_surfer_archived", "is_initiator_archived")
    rename_column("host_last_seen_message_id", "recipient_last_seen_message_id")
    rename_column("surfer_last_seen_message_id", "initiator_last_seen_message_id")
    rename_column("host_sent_reference_reminders", "recipient_sent_reference_reminders")
    rename_column("surfer_sent_reference_reminders", "initiator_sent_reference_reminders")
    rename_column("host_sent_request_reminders", "recipient_sent_request_reminders")
    rename_column("host_reason_didnt_meetup", "recipient_reason_didnt_meetup")
    rename_column("surfer_reason_didnt_meetup", "initiator_reason_didnt_meetup")

    # Rename constraints (only if old columns existed, meaning we need to rename)
    if "surfer_user_id" in columns:
        op.execute(
            "ALTER TABLE host_requests RENAME CONSTRAINT fk_host_requests_surfer_user_id_users "
            "TO fk_host_requests_initiator_user_id_users"
        )
        op.execute(
            "ALTER TABLE host_requests RENAME CONSTRAINT fk_host_requests_host_user_id_users "
            "TO fk_host_requests_recipient_user_id_users"
        )

    # Rename indexes
    rename_index("ix_host_requests_surfer_user_id", "ix_host_requests_initiator_user_id")
    rename_index("ix_host_requests_host_user_id", "ix_host_requests_recipient_user_id")
    rename_index("ix_host_requests_host_didnt_meetup", "ix_host_requests_recipient_didnt_meetup")
    rename_index("ix_host_requests_surfer_didnt_meetup", "ix_host_requests_initiator_didnt_meetup")


def downgrade() -> None:
    raise NotImplementedError("Downgrade requires reverting code changes first")
