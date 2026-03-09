"""Add value and source to EventLog

Revision ID: 0137
Revises: 0136
Create Date: 2026-02-21 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0137"
down_revision = "0136"
branch_labels = None
depends_on = None


def upgrade() -> None:
    eventsource_enum = sa.Enum("backend", "frontend", name="eventsource", schema="public")
    eventsource_enum.create(op.get_bind(), checkfirst=True)

    # add as nullable first, backfill, then make NOT NULL
    op.add_column("event_log", sa.Column("value", sa.Float(), nullable=True), schema="logging")
    op.add_column(
        "event_log",
        sa.Column("source", eventsource_enum, nullable=True),
        schema="logging",
    )

    op.execute("UPDATE logging.event_log SET value = 1 WHERE value IS NULL")
    op.execute("UPDATE logging.event_log SET source = 'backend' WHERE source IS NULL")

    op.alter_column("event_log", "value", nullable=False, server_default="1.0", schema="logging")
    op.alter_column("event_log", "source", nullable=False, schema="logging")


def downgrade() -> None:
    op.drop_column("event_log", "source", schema="logging")
    op.drop_column("event_log", "value", schema="logging")

    sa.Enum(name="eventsource", schema="public").drop(op.get_bind(), checkfirst=True)
