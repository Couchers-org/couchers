"""Index emails.time and give emails a sequential id

Revision ID: 0174
Revises: 0173
Create Date: 2026-07-31 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0174"
down_revision = "0173"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # on prod, built by hand ahead of the deploy so the migration doesn't add downtime
    with op.get_context().autocommit_block():
        op.create_index(
            "ix_emails_time",
            "emails",
            ["time"],
            postgresql_concurrently=True,
            if_not_exists=True,
        )

    op.alter_column("emails", "id", new_column_name="message_id")
    op.execute("ALTER TABLE emails RENAME CONSTRAINT emails_id_not_null TO emails_message_id_not_null")

    op.execute("CREATE SEQUENCE emails_id_seq")
    op.add_column("emails", sa.Column("id", sa.BigInteger(), nullable=True))
    # set apart from the ADD COLUMN: a volatile default there would rewrite the table
    op.execute("ALTER TABLE emails ALTER COLUMN id SET DEFAULT nextval('emails_id_seq')")
    # existing rows are backfilled with 1..count out of band, so start new emails above them
    op.execute("SELECT setval('emails_id_seq', (SELECT count(*) FROM emails) + 1, false)")


def downgrade() -> None:
    op.drop_column("emails", "id")
    op.execute("DROP SEQUENCE emails_id_seq")
    op.execute("ALTER TABLE emails RENAME CONSTRAINT emails_message_id_not_null TO emails_id_not_null")
    op.alter_column("emails", "message_id", new_column_name="id")

    with op.get_context().autocommit_block():
        op.drop_index(
            "ix_emails_time",
            table_name="emails",
            postgresql_concurrently=True,
            if_exists=True,
        )
