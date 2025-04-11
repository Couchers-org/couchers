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
        SELECT anon_1.user_id AS user_id,
            count(*) AS requests,
            count(anon_1.response_time) / CAST(count(*) AS NUMERIC) AS response_rate,
            avg(anon_1.response_time) AS avg_response_time,
            PERCENTILE_DISC(0.33) WITHIN GROUP (
                ORDER BY COALESCE(anon_1.response_time, make_interval(secs => (86400000.0)::double precision))
            ) AS response_time_33p,
            PERCENTILE_DISC(0.66) WITHIN GROUP (
                ORDER BY COALESCE(anon_1.response_time, make_interval(secs => (86400000.0)::double precision))
            ) AS response_time_66p
        FROM (
                SELECT host_requests.host_user_id AS user_id,
                    anon_2.time - anon_3.time AS response_time
                FROM host_requests
                    JOIN (
                        SELECT messages.conversation_id AS conversation_id,
                            messages.time AS time
                        FROM messages
                        WHERE messages.message_type = 'chat_created'
                    ) AS anon_3 ON anon_3.conversation_id = host_requests.id
                    LEFT OUTER JOIN (
                        SELECT messages.conversation_id AS conversation_id,
                            messages.author_id AS author_id,
                            min(messages.time) AS time
                        FROM messages
                        GROUP BY messages.conversation_id,
                            messages.author_id
                    ) AS anon_2 ON anon_2.conversation_id = host_requests.id
                    AND anon_2.author_id = host_requests.host_user_id
                UNION ALL
                SELECT activeness_probes.user_id AS user_id,
                    CASE
                        WHEN (activeness_probes.response != 'expired') THEN activeness_probes.responded - activeness_probes.probe_initiated
                    END AS response_time
                FROM activeness_probes
            ) AS anon_1
        GROUP BY anon_1.user_id;

        CREATE UNIQUE INDEX uq_user_response_rates_id ON user_response_rates(user_id);
    """
    )


def downgrade():
    op.execute("DROP MATERIALIZED VIEW uq_user_response_rates_id;")
