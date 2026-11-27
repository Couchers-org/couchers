"""Leave hidden unanswered requests out of user_response_rates and add received_requests_28d

Revision ID: 0210
Revises: 0209
Create Date: 2026-11-26 12:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0210"
down_revision = "0209"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        DROP MATERIALIZED VIEW user_response_rates;

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
            ) AS response_time_66p,
            avg(anon_1.response96h) AS response96h,
            count(anon_1.response96h) FILTER (WHERE NOT anon_1.is_probe) AS requests96h,
            count(anon_1.response96h) FILTER (WHERE anon_1.is_probe) AS probes96h,
            sum(power(0.8, anon_1.later_responses96h)) FILTER (WHERE anon_1.response96h IS NOT NULL) AS requests96h_decayed,
            sum(power(0.8, anon_1.later_responses96h) * anon_1.response96h) AS responses96h_decayed,
            avg(anon_1.accept168h) AS accept168h,
            count(anon_1.accept168h) AS requests168h,
            count(*) FILTER (WHERE anon_1.visible28d) AS received_requests_28d
        FROM (
            SELECT anon_2.user_id AS user_id,
                anon_2.time AS time,
                anon_2.is_probe AS is_probe,
                anon_2.visible28d AS visible28d,
                anon_2.response_time AS response_time,
                anon_2.response96h AS response96h,
                anon_2.accept168h AS accept168h,
                count(anon_2.response96h) OVER (
                    PARTITION BY anon_2.user_id
                    ORDER BY anon_2.time DESC
                    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                ) - 1 AS later_responses96h
            FROM (
                SELECT host_requests.recipient_user_id AS user_id,
                    anon_3.time AS time,
                    false AS is_probe,
                    anon_3.time > now() - make_interval(secs => (2419200.0)::double precision)
                    AND (
                        moderation_states.visibility = 'visible'
                        OR moderation_states.visibility = 'unlisted'
                        OR moderation_states.visibility = 'shadowed'
                        AND host_requests.initiator_user_id = host_requests.recipient_user_id
                    )
                    AND host.banned_at IS NULL
                    AND host.deleted_at IS NULL
                    AND sender.banned_at IS NULL
                    AND sender.deleted_at IS NULL
                    AND sender.shadowed_at IS NULL
                    AND NOT (
                        EXISTS (
                            SELECT 1
                            FROM user_blocks
                            WHERE user_blocks.blocking_user_id = host.id
                                AND user_blocks.blocked_user_id = sender.id
                                OR user_blocks.blocking_user_id = sender.id
                                AND user_blocks.blocked_user_id = host.id
                        )
                    ) AS visible28d,
                    anon_4.time - anon_3.time AS response_time,
                    CASE
                        WHEN (
                            anon_3.time < now() - make_interval(secs => (345600.0)::double precision)
                            AND anon_4.time - anon_3.time < make_interval(secs => (345600.0)::double precision)
                        ) THEN 1
                        WHEN (
                            anon_3.time < now() - make_interval(secs => (345600.0)::double precision)
                            AND (
                                anon_4.time IS NOT NULL
                                OR NOT (
                                    EXISTS (
                                        SELECT messages.id
                                        FROM messages
                                        WHERE messages.conversation_id = host_requests.id
                                            AND messages.host_request_status_target = 'cancelled'
                                            AND messages.time < anon_3.time + make_interval(secs => (345600.0)::double precision)
                                    )
                                )
                            )
                        ) THEN 0
                    END AS response96h,
                    CASE
                        WHEN (
                            anon_3.time < now() - make_interval(secs => (604800.0)::double precision)
                            AND anon_4.accepted - anon_3.time < make_interval(secs => (604800.0)::double precision)
                        ) THEN 1
                        WHEN (
                            anon_3.time < now() - make_interval(secs => (604800.0)::double precision)
                            AND (
                                anon_4.time IS NOT NULL
                                OR NOT (
                                    EXISTS (
                                        SELECT messages.id
                                        FROM messages
                                        WHERE messages.conversation_id = host_requests.id
                                            AND messages.host_request_status_target = 'cancelled'
                                            AND messages.time < anon_3.time + make_interval(secs => (604800.0)::double precision)
                                    )
                                )
                            )
                        ) THEN 0
                    END AS accept168h
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
                            min(messages.time) AS time,
                            min(messages.time) FILTER (WHERE messages.host_request_status_target = 'accepted') AS accepted
                        FROM messages
                        GROUP BY messages.conversation_id,
                            messages.author_id
                    ) AS anon_4 ON anon_4.conversation_id = host_requests.id
                    AND anon_4.author_id = host_requests.recipient_user_id
                    JOIN moderation_states ON moderation_states.id = host_requests.moderation_state_id
                    JOIN users AS host ON host.id = host_requests.recipient_user_id
                    JOIN users AS sender ON sender.id = host_requests.initiator_user_id
                WHERE host_requests.proposal_kind = 'request'
                    AND (
                        anon_4.time IS NOT NULL
                        OR (
                            moderation_states.visibility = 'visible'
                            OR moderation_states.visibility = 'unlisted'
                            OR moderation_states.visibility = 'shadowed'
                            AND host_requests.initiator_user_id = host_requests.recipient_user_id
                        )
                        AND host.banned_at IS NULL
                        AND host.deleted_at IS NULL
                        AND sender.banned_at IS NULL
                        AND sender.deleted_at IS NULL
                        AND sender.shadowed_at IS NULL
                        AND NOT (
                            EXISTS (
                                SELECT 1
                                FROM user_blocks
                                WHERE user_blocks.blocking_user_id = host.id
                                    AND user_blocks.blocked_user_id = sender.id
                                    OR user_blocks.blocking_user_id = sender.id
                                    AND user_blocks.blocked_user_id = host.id
                            )
                        )
                    )
                UNION ALL
                SELECT activeness_probes.user_id AS user_id,
                    activeness_probes.probe_initiated AS probe_initiated,
                    true AS is_probe,
                    false AS visible28d,
                    CASE
                        WHEN (activeness_probes.response != 'expired') THEN activeness_probes.responded - activeness_probes.probe_initiated
                    END AS response_time,
                    CASE
                        WHEN (activeness_probes.response IN ('still_active', 'no_longer_active')) THEN 1
                        WHEN (activeness_probes.response = 'expired') THEN 0
                    END AS response96h,
                    NULL AS accept168h
                FROM activeness_probes
            ) AS anon_2
        ) AS anon_1
        GROUP BY anon_1.user_id;

        CREATE UNIQUE INDEX uq_user_response_rates_id ON user_response_rates(user_id);
    """
    )


def downgrade() -> None:
    op.execute(
        """
        DROP MATERIALIZED VIEW user_response_rates;

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
            ) AS response_time_66p,
            avg(anon_1.response96h) AS response96h,
            count(anon_1.response96h) FILTER (WHERE NOT anon_1.is_probe) AS requests96h,
            count(anon_1.response96h) FILTER (WHERE anon_1.is_probe) AS probes96h,
            sum(power(0.8, anon_1.later_responses96h)) FILTER (WHERE anon_1.response96h IS NOT NULL) AS requests96h_decayed,
            sum(power(0.8, anon_1.later_responses96h) * anon_1.response96h) AS responses96h_decayed,
            avg(anon_1.accept168h) AS accept168h,
            count(anon_1.accept168h) AS requests168h
        FROM (
            SELECT anon_2.user_id AS user_id,
                anon_2.time AS time,
                anon_2.is_probe AS is_probe,
                anon_2.response_time AS response_time,
                anon_2.response96h AS response96h,
                anon_2.accept168h AS accept168h,
                count(anon_2.response96h) OVER (
                    PARTITION BY anon_2.user_id
                    ORDER BY anon_2.time DESC
                    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                ) - 1 AS later_responses96h
            FROM (
                SELECT host_requests.recipient_user_id AS user_id,
                    anon_3.time AS time,
                    false AS is_probe,
                    anon_4.time - anon_3.time AS response_time,
                    CASE
                        WHEN (
                            anon_3.time < now() - make_interval(secs => (345600.0)::double precision)
                            AND anon_4.time - anon_3.time < make_interval(secs => (345600.0)::double precision)
                        ) THEN 1
                        WHEN (
                            anon_3.time < now() - make_interval(secs => (345600.0)::double precision)
                            AND (
                                anon_4.time IS NOT NULL
                                OR (
                                    moderation_states.visibility = 'visible'
                                    OR moderation_states.visibility = 'unlisted'
                                    OR moderation_states.visibility = 'shadowed'
                                    AND host_requests.initiator_user_id = host_requests.recipient_user_id
                                )
                                AND host.banned_at IS NULL
                                AND host.deleted_at IS NULL
                                AND sender.banned_at IS NULL
                                AND sender.deleted_at IS NULL
                                AND sender.shadowed_at IS NULL
                                AND NOT (
                                    EXISTS (
                                        SELECT 1
                                        FROM user_blocks
                                        WHERE user_blocks.blocking_user_id = host.id
                                            AND user_blocks.blocked_user_id = sender.id
                                            OR user_blocks.blocking_user_id = sender.id
                                            AND user_blocks.blocked_user_id = host.id
                                    )
                                )
                                AND NOT (
                                    EXISTS (
                                        SELECT messages.id
                                        FROM messages
                                        WHERE messages.conversation_id = host_requests.id
                                            AND messages.host_request_status_target = 'cancelled'
                                            AND messages.time < anon_3.time + make_interval(secs => (345600.0)::double precision)
                                    )
                                )
                            )
                        ) THEN 0
                    END AS response96h,
                    CASE
                        WHEN (
                            anon_3.time < now() - make_interval(secs => (604800.0)::double precision)
                            AND anon_4.accepted - anon_3.time < make_interval(secs => (604800.0)::double precision)
                        ) THEN 1
                        WHEN (
                            anon_3.time < now() - make_interval(secs => (604800.0)::double precision)
                            AND (
                                anon_4.time IS NOT NULL
                                OR (
                                    moderation_states.visibility = 'visible'
                                    OR moderation_states.visibility = 'unlisted'
                                    OR moderation_states.visibility = 'shadowed'
                                    AND host_requests.initiator_user_id = host_requests.recipient_user_id
                                )
                                AND host.banned_at IS NULL
                                AND host.deleted_at IS NULL
                                AND sender.banned_at IS NULL
                                AND sender.deleted_at IS NULL
                                AND sender.shadowed_at IS NULL
                                AND NOT (
                                    EXISTS (
                                        SELECT 1
                                        FROM user_blocks
                                        WHERE user_blocks.blocking_user_id = host.id
                                            AND user_blocks.blocked_user_id = sender.id
                                            OR user_blocks.blocking_user_id = sender.id
                                            AND user_blocks.blocked_user_id = host.id
                                    )
                                )
                                AND NOT (
                                    EXISTS (
                                        SELECT messages.id
                                        FROM messages
                                        WHERE messages.conversation_id = host_requests.id
                                            AND messages.host_request_status_target = 'cancelled'
                                            AND messages.time < anon_3.time + make_interval(secs => (604800.0)::double precision)
                                    )
                                )
                            )
                        ) THEN 0
                    END AS accept168h
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
                            min(messages.time) AS time,
                            min(messages.time) FILTER (WHERE messages.host_request_status_target = 'accepted') AS accepted
                        FROM messages
                        GROUP BY messages.conversation_id,
                            messages.author_id
                    ) AS anon_4 ON anon_4.conversation_id = host_requests.id
                    AND anon_4.author_id = host_requests.recipient_user_id
                    JOIN moderation_states ON moderation_states.id = host_requests.moderation_state_id
                    JOIN users AS host ON host.id = host_requests.recipient_user_id
                    JOIN users AS sender ON sender.id = host_requests.initiator_user_id
                WHERE host_requests.proposal_kind = 'request'
                UNION ALL
                SELECT activeness_probes.user_id AS user_id,
                    activeness_probes.probe_initiated AS probe_initiated,
                    true AS is_probe,
                    CASE
                        WHEN (activeness_probes.response != 'expired') THEN activeness_probes.responded - activeness_probes.probe_initiated
                    END AS response_time,
                    CASE
                        WHEN (activeness_probes.response IN ('still_active', 'no_longer_active')) THEN 1
                        WHEN (activeness_probes.response = 'expired') THEN 0
                    END AS response96h,
                    NULL AS accept168h
                FROM activeness_probes
            ) AS anon_2
        ) AS anon_1
        GROUP BY anon_1.user_id;

        CREATE UNIQUE INDEX uq_user_response_rates_id ON user_response_rates(user_id);
    """
    )
