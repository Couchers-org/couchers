"""Add EventLog table

Revision ID: d3189338b8c1
Revises: 8191f466c673
Create Date: 2026-02-07 14:47:59.473072

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "d3189338b8c1"
down_revision = "8191f466c673"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "event_log",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("occurred", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("version", sa.String(), nullable=False),
        sa.Column("sofa", sa.String(), nullable=True),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=True),
        sa.Column("properties", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_event_log")),
        schema="logging",
    )
    op.create_index("ix_logging_event_log_created", "event_log", ["created"], unique=False, schema="logging")
    op.create_index(
        "ix_logging_event_log_event_type_created",
        "event_log",
        ["event_type", "created"],
        unique=False,
        schema="logging",
    )
    op.create_index(
        "ix_logging_event_log_user_id_created",
        "event_log",
        ["user_id", "created"],
        unique=False,
        schema="logging",
    )


def downgrade() -> None:
    op.drop_index("ix_logging_event_log_user_id_created", table_name="event_log", schema="logging")
    op.drop_index("ix_logging_event_log_event_type_created", table_name="event_log", schema="logging")
    op.drop_index("ix_logging_event_log_created", table_name="event_log", schema="logging")
    op.drop_table("event_log", schema="logging")
