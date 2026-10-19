"""Add host_requests.kind to distinguish requests from public trip offers

Revision ID: 0197
Revises: 0196
Create Date: 2026-10-18 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0197"
down_revision = "0196"
branch_labels = None
depends_on = None


def create_user_response_rates(host_requests_filter: str) -> None:
    op.execute(
        f"""
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
            ) AS response_time_66p
        FROM (
                SELECT host_requests.recipient_user_id AS user_id,
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
                    AND anon_2.author_id = host_requests.recipient_user_id
                {host_requests_filter}
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


def upgrade() -> None:
    sa.Enum("request", "public_trip_offer", name="hostrequestkind").create(op.get_bind())
    op.add_column(
        "host_requests",
        sa.Column("kind", sa.Enum("request", "public_trip_offer", name="hostrequestkind"), nullable=True),
    )
    op.execute(
        """
        UPDATE host_requests
        SET kind = CASE WHEN public_trip_id IS NULL THEN 'request' ELSE 'public_trip_offer' END::hostrequestkind
        """
    )
    op.alter_column("host_requests", "kind", nullable=False)
    op.create_check_constraint(
        "ck_host_requests_public_trip_id_iff_public_trip_offer",
        "host_requests",
        "(kind = 'public_trip_offer') = (public_trip_id IS NOT NULL)",
    )
    op.execute(
        """
        ALTER TABLE host_requests
            ALTER COLUMN surfer_user_id SET EXPRESSION AS
                (CASE WHEN kind = 'request' THEN initiator_user_id ELSE recipient_user_id END),
            ALTER COLUMN host_user_id SET EXPRESSION AS
                (CASE WHEN kind = 'request' THEN recipient_user_id ELSE initiator_user_id END)
        """
    )
    op.drop_index("ix_host_requests_one_active_offer_per_trip", table_name="host_requests")
    op.create_index(
        "ix_host_requests_one_active_offer_per_trip",
        "host_requests",
        ["public_trip_id", "initiator_user_id"],
        unique=True,
        postgresql_where="kind = 'public_trip_offer' AND status != 'cancelled'",
    )
    create_user_response_rates("WHERE host_requests.kind = 'request'")


def downgrade() -> None:
    create_user_response_rates("WHERE host_requests.public_trip_id IS NULL")
    op.drop_index("ix_host_requests_one_active_offer_per_trip", table_name="host_requests")
    op.create_index(
        "ix_host_requests_one_active_offer_per_trip",
        "host_requests",
        ["public_trip_id", "initiator_user_id"],
        unique=True,
        postgresql_where="public_trip_id IS NOT NULL AND status != 'cancelled'",
    )
    op.execute(
        """
        ALTER TABLE host_requests
            ALTER COLUMN surfer_user_id SET EXPRESSION AS
                (CASE WHEN public_trip_id IS NULL THEN initiator_user_id ELSE recipient_user_id END),
            ALTER COLUMN host_user_id SET EXPRESSION AS
                (CASE WHEN public_trip_id IS NULL THEN recipient_user_id ELSE initiator_user_id END)
        """
    )
    op.drop_constraint("ck_host_requests_public_trip_id_iff_public_trip_offer", "host_requests")
    op.drop_column("host_requests", "kind")
    sa.Enum(name="hostrequestkind").drop(op.get_bind())
