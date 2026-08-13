"""Move event comment thread from Event to EventOccurrence

Revision ID: 0181
Revises: 0180
Create Date: 2026-08-13 07:21:39.779870

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0181"
down_revision = "0180"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("event_occurrences", sa.Column("thread_id", sa.BigInteger(), nullable=True))

    # Each event's most recent occurrence keeps the event's existing thread (and its comments):
    # this is the occurrence that comment/reply notifications were already being generated against.
    op.execute(
        """
        UPDATE event_occurrences eo
        SET thread_id = e.thread_id
        FROM events e
        WHERE eo.event_id = e.id
          AND eo.id = (SELECT max(eo2.id) FROM event_occurrences eo2 WHERE eo2.event_id = e.id)
        """
    )

    # Every other occurrence of a repeating event gets its own fresh, empty thread
    op.execute(
        """
        DO $$
        DECLARE
            occ_id BIGINT;
            new_thread_id BIGINT;
        BEGIN
            FOR occ_id IN SELECT id FROM event_occurrences WHERE thread_id IS NULL LOOP
                INSERT INTO threads DEFAULT VALUES RETURNING id INTO new_thread_id;
                UPDATE event_occurrences SET thread_id = new_thread_id WHERE id = occ_id;
            END LOOP;
        END $$
        """
    )

    op.alter_column("event_occurrences", "thread_id", nullable=False)
    op.create_unique_constraint(op.f("uq_event_occurrences_thread_id"), "event_occurrences", ["thread_id"])
    op.create_foreign_key(
        op.f("fk_event_occurrences_thread_id_threads"), "event_occurrences", "threads", ["thread_id"], ["id"]
    )

    op.drop_constraint(op.f("uq_events_thread_id"), "events", type_="unique")
    op.drop_constraint(op.f("fk_events_thread_id_threads"), "events", type_="foreignkey")
    op.drop_column("events", "thread_id")


def downgrade() -> None:
    op.add_column("events", sa.Column("thread_id", sa.BigInteger(), autoincrement=False, nullable=True))

    # Each event reclaims the thread of its most recent occurrence; comments on other
    # occurrences' threads are orphaned (unreachable from the Event) as a result.
    op.execute(
        """
        UPDATE events e
        SET thread_id = (
            SELECT eo.thread_id
            FROM event_occurrences eo
            WHERE eo.event_id = e.id
            ORDER BY eo.id DESC
            LIMIT 1
        )
        """
    )

    op.alter_column("events", "thread_id", nullable=False)
    op.create_foreign_key(op.f("fk_events_thread_id_threads"), "events", "threads", ["thread_id"], ["id"])
    op.create_unique_constraint(op.f("uq_events_thread_id"), "events", ["thread_id"])

    op.drop_constraint(op.f("fk_event_occurrences_thread_id_threads"), "event_occurrences", type_="foreignkey")
    op.drop_constraint(op.f("uq_event_occurrences_thread_id"), "event_occurrences", type_="unique")
    op.drop_column("event_occurrences", "thread_id")
