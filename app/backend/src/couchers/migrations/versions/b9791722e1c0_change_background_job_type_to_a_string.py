"""Change background job type to a string

Revision ID: b9791722e1c0
Revises: 989c7f1803f4
Create Date: 2024-04-07 09:06:56.410595

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "b9791722e1c0"
down_revision = "989c7f1803f4"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        "background_jobs",
        "job_type",
        existing_type=postgresql.ENUM(
            "send_email",
            "purge_login_tokens",
            "purge_signup_tokens",
            "send_message_notifications",
            "send_onboarding_emails",
            "add_users_to_email_list",
            "send_request_notifications",
            "enforce_community_membership",
            "send_reference_reminders",
            "handle_notification",
            "handle_email_notifications",
            "handle_email_digests",
            "generate_message_notifications",
            "purge_account_deletion_tokens",
            "purge_password_reset_tokens",
            "update_recommendation_scores",
            "refresh_materialized_views",
            name="backgroundjobtype",
        ),
        type_=sa.String(),
        existing_nullable=False,
    )
    op.execute("DROP TYPE backgroundjobtype")


def downgrade():
    op.alter_column(
        "background_jobs",
        "job_type",
        existing_type=sa.String(),
        type_=postgresql.ENUM(
            "send_email",
            "purge_login_tokens",
            "purge_signup_tokens",
            "send_message_notifications",
            "send_onboarding_emails",
            "add_users_to_email_list",
            "send_request_notifications",
            "enforce_community_membership",
            "send_reference_reminders",
            "handle_notification",
            "handle_email_notifications",
            "handle_email_digests",
            "generate_message_notifications",
            "purge_account_deletion_tokens",
            "purge_password_reset_tokens",
            "update_recommendation_scores",
            "refresh_materialized_views",
            name="backgroundjobtype",
        ),
        existing_nullable=False,
    )
