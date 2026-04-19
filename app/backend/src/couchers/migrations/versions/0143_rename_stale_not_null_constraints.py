"""Rename stale NOT NULL constraints left over from renamed columns

Revision ID: 0143
Revises: 0142
Create Date: 2026-04-19 12:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0143"
down_revision = "0142"
branch_labels = None
depends_on = None


# (table, old_constraint_name, new_constraint_name)
RENAMES = [
    (
        "host_requests",
        "host_requests_from_last_seen_message_id_not_null",
        "host_requests_initiator_last_seen_message_id_not_null",
    ),
    (
        "host_requests",
        "host_requests_from_sent_reference_reminders_not_null",
        "host_requests_initiator_sent_reference_reminders_not_null",
    ),
    ("host_requests", "host_requests_from_user_id_not_null", "host_requests_initiator_user_id_not_null"),
    ("host_requests", "host_requests_is_surfer_archived_not_null", "host_requests_is_initiator_archived_not_null"),
    ("host_requests", "host_requests_is_host_archived_not_null", "host_requests_is_recipient_archived_not_null"),
    (
        "host_requests",
        "host_requests_to_last_seen_message_id_not_null",
        "host_requests_recipient_last_seen_message_id_not_null",
    ),
    (
        "host_requests",
        "host_requests_to_sent_reference_reminders_not_null",
        "host_requests_recipient_sent_reference_reminders_not_null",
    ),
    (
        "host_requests",
        "host_requests_host_sent_request_reminders_not_null",
        "host_requests_recipient_sent_request_reminders_not_null",
    ),
    ("host_requests", "host_requests_to_user_id_not_null", "host_requests_recipient_user_id_not_null"),
    (
        "postal_verification_attempts",
        "postal_verification_attempts_country_not_null",
        "postal_verification_attempts_country_code_not_null",
    ),
    ("users", "users_added_to_mailing_list_not_null", "users_in_sync_with_newsletter_not_null"),
    ("users", "users_daily_order_key_not_null", "users_recommendation_score_not_null"),
]


def upgrade() -> None:
    for table, old, new in RENAMES:
        op.execute(f"ALTER TABLE {table} RENAME CONSTRAINT {old} TO {new}")


def downgrade() -> None:
    for table, old, new in RENAMES:
        op.execute(f"ALTER TABLE {table} RENAME CONSTRAINT {new} TO {old}")
