"""Add event_recurrences table

Revision ID: 0188
Revises: 0187
Create Date: 2026-09-02 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0188"
down_revision = "0187"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "event_recurrences",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("event_id", sa.BigInteger(), nullable=False),
        sa.Column("rrule_interval", sa.Integer(), nullable=False),
        sa.Column("last_scheduled_date", sa.Date(), nullable=False),
        sa.Column("ends_on_date", sa.Date(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], name=op.f("fk_event_recurrences_event_id_events")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_event_recurrences")),
        sa.UniqueConstraint("event_id", name=op.f("uq_event_recurrences_event_id")),
    )


def downgrade() -> None:
    op.drop_table("event_recurrences")
