"""Rename HostRequest user columns

Revision ID: 0025
Revises: 0024
Create Date: 2021-07-13 01:47:30.120271

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0025"
down_revision = "0024"
branch_labels = None
depends_on = None


def upgrade() -> None:
    ### Manually generated
    op.alter_column("host_requests", "from_user_id", new_column_name="surfer_user_id")
    op.alter_column("host_requests", "to_user_id", new_column_name="host_user_id")
    op.alter_column("host_requests", "from_last_seen_message_id", new_column_name="surfer_last_seen_message_id")
    op.alter_column("host_requests", "to_last_seen_message_id", new_column_name="host_last_seen_message_id")
    op.alter_column("host_requests", "from_sent_reference_reminders", new_column_name="surfer_sent_reference_reminders")
    op.alter_column("host_requests", "to_sent_reference_reminders", new_column_name="host_sent_reference_reminders")
    op.execute(
        "ALTER TABLE host_requests RENAME CONSTRAINT fk_host_requests_from_user_id_users TO fk_host_requests_surfer_user_id_users"
    )
    op.execute(
        "ALTER TABLE host_requests RENAME CONSTRAINT fk_host_requests_to_user_id_users TO fk_host_requests_host_user_id_users"
    )
    op.execute("ALTER INDEX ix_host_requests_from_user_id RENAME TO ix_host_requests_surfer_user_id")
    op.execute("ALTER INDEX ix_host_requests_to_user_id RENAME TO ix_host_requests_host_user_id")


def downgrade() -> None:
    pass
