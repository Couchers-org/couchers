"""Backfill emails.id and make it the primary key

Revision ID: 0175
Revises: 0174
Create Date: 2026-08-01 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0175"
down_revision = "0174"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # takes the lowest unused ids rather than counting from 1, so a partly filled table can't collide
    op.execute("""
        WITH pending AS (
            SELECT message_id, row_number() OVER (ORDER BY time, message_id) AS rn
            FROM emails
            WHERE id IS NULL
        ), free AS (
            SELECT i, row_number() OVER (ORDER BY i) AS rn
            FROM generate_series(1, (SELECT count(*) FROM emails)) AS i
            WHERE NOT EXISTS (SELECT 1 FROM emails WHERE emails.id = i)
        )
        UPDATE emails
        SET id = free.i
        FROM pending JOIN free USING (rn)
        WHERE emails.message_id = pending.message_id
    """)

    op.alter_column("emails", "id", nullable=False)

    with op.get_context().autocommit_block():
        op.create_index(
            "ix_emails_id",
            "emails",
            ["id"],
            unique=True,
            postgresql_concurrently=True,
            if_not_exists=True,
        )
        op.create_index(
            "uq_emails_message_id",
            "emails",
            ["message_id"],
            unique=True,
            postgresql_concurrently=True,
            if_not_exists=True,
        )
        op.create_index(
            "ix_emails_recipient_time",
            "emails",
            ["recipient", sa.text("time DESC")],
            postgresql_concurrently=True,
            if_not_exists=True,
        )

    op.execute("ALTER TABLE emails DROP CONSTRAINT pk_emails")
    # postgres renames the index to the constraint name
    op.execute("ALTER TABLE emails ADD CONSTRAINT pk_emails PRIMARY KEY USING INDEX ix_emails_id")
    op.execute("ALTER TABLE emails ADD CONSTRAINT uq_emails_message_id UNIQUE USING INDEX uq_emails_message_id")
    # matches what a bigserial column would have
    op.execute("ALTER SEQUENCE emails_id_seq OWNED BY emails.id")


def downgrade() -> None:
    with op.get_context().autocommit_block():
        op.drop_index(
            "ix_emails_recipient_time",
            table_name="emails",
            postgresql_concurrently=True,
            if_exists=True,
        )

    op.execute("ALTER SEQUENCE emails_id_seq OWNED BY NONE")
    op.execute("ALTER TABLE emails DROP CONSTRAINT uq_emails_message_id")
    op.execute("ALTER TABLE emails DROP CONSTRAINT pk_emails")
    op.execute("ALTER TABLE emails ADD CONSTRAINT pk_emails PRIMARY KEY (message_id)")
    op.alter_column("emails", "id", nullable=True)
