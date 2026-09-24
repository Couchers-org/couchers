"""Add event_recurrences table

Revision ID: 0188
Revises: 0187
Create Date: 2026-09-02 00:00:00.000000

"""

import geoalchemy2
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
        sa.Column("content", sa.String(), nullable=False),
        sa.Column("photo_key", sa.String(), nullable=True),
        sa.Column(
            "geom",
            geoalchemy2.types.Geometry(geometry_type="POINT", srid=4326, from_text="ST_GeomFromEWKT", name="geometry"),
            nullable=False,
        ),
        sa.Column("address", sa.String(), nullable=False),
        sa.Column("timezone", sa.String(), nullable=False),
        sa.Column("dtstart_date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("day_delta", sa.Integer(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("rrule_interval", sa.Integer(), nullable=False),
        sa.Column("last_scheduled_date", sa.Date(), nullable=False),
        sa.Column("ends_on_date", sa.Date(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "rrule_interval IN (1, 2)",
            name=op.f("ck_event_recurrences_rrule_interval_weekly_or_biweekly"),
        ),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], name=op.f("fk_event_recurrences_event_id_events")),
        sa.ForeignKeyConstraint(["photo_key"], ["uploads.key"], name=op.f("fk_event_recurrences_photo_key_uploads")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_event_recurrences")),
        sa.UniqueConstraint("event_id", name=op.f("uq_event_recurrences_event_id")),
    )


def downgrade() -> None:
    op.drop_table("event_recurrences")
