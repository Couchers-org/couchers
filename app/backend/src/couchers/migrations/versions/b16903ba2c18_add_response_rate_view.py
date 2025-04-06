"""Add response rate view

Revision ID: b16903ba2c18
Revises: 8a62223e4cbd
Create Date: 2025-04-06 17:16:13.762102

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "b16903ba2c18"
down_revision = "8a62223e4cbd"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        CREATE MATERIALIZED VIEW user_response_rates AS
        SELECT users.id AS user_id,
            COALESCE(grouped.requests, 0) AS requests,
            COALESCE(grouped.response_rate, 0.) AS response_rate,
            grouped.avg_response_time AS avg_response_time,
            grouped.response_time_33p AS response_time_33p,
            grouped.response_time_66p AS response_time_66p
            FROM users
            LEFT OUTER JOIN (
                SELECT responses.user_id AS user_id,
                count(*) AS requests,
                count(responses.response_time) / CAST(count(*) AS NUMERIC) AS response_rate,
                avg(responses.response_time) AS avg_response_time,
                PERCENTILE_DISC(0.33) WITHIN GROUP (
                    ORDER BY COALESCE(responses.response_time, interval '1000 days')
                ) AS response_time_33p,
                PERCENTILE_DISC(0.66) WITHIN GROUP (
                    ORDER BY COALESCE(responses.response_time, interval '1000 days')
                ) AS response_time_66p
                FROM (
                    SELECT host_requests.host_user_id AS user_id,
                    hr_responded.time - hr_created.time AS response_time
                    FROM host_requests
                    JOIN (
                        SELECT messages.conversation_id AS conversation_id,
                        messages.time AS time
                        FROM messages
                        WHERE messages.message_type = 'chat_created'
                    ) AS hr_created ON hr_created.conversation_id = host_requests.id
                    LEFT OUTER JOIN (
                        SELECT messages.conversation_id AS conversation_id,
                        messages.author_id AS author_id,
                        min(messages.time) AS time
                        FROM messages
                        GROUP BY messages.conversation_id,
                        messages.author_id
                    ) AS hr_responded ON hr_responded.conversation_id = host_requests.id
                    AND hr_responded.author_id = host_requests.host_user_id
                    UNION ALL
                    SELECT activeness_probes.user_id AS user_id,
                    CASE
                        WHEN (activeness_probes.response != 'expired') THEN activeness_probes.responded - activeness_probes.probe_initiated
                    END AS response_time
                    FROM activeness_probes
                ) AS responses
                GROUP BY responses.user_id
            ) AS grouped ON grouped.user_id = users.id;

        CREATE UNIQUE INDEX uq_user_response_rates_id ON user_response_rates(user_id);
    """
    )


def downgrade():
    op.execute("DROP MATERIALIZED VIEW uq_user_response_rates_id;")
