"""Update donation and invoice tables

Revision ID: f555ed35e4d0
Revises: 91bd06f6a96a
Create Date: 2025-11-12 10:42:13.972975

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "f555ed35e4d0"
down_revision = "91bd06f6a96a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create the enum types for on_platform (donations on our platform) and external_shop (donations through external merch shop)
    invoicetype_enum = sa.Enum("on_platform", "external_shop", name="invoicetype")
    invoicetype_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "invoices",
        sa.Column("invoice_type", invoicetype_enum, nullable=False, server_default="on_platform"),
    )
    # Remove server default after column is created (for future inserts, code must specify type)
    op.alter_column("invoices", "invoice_type", server_default=None)

    op.add_column(
        "users", sa.Column("last_donated", sa.DateTime(timezone=True), server_default=sa.text("NULL"), nullable=True)
    )

    # Backfill last_donated from invoices table - set to the timestamp of the most recent invoice
    op.execute("""
        UPDATE users
        SET last_donated = (
            SELECT MAX(created)
            FROM invoices
            WHERE invoices.user_id = users.id
        )
        WHERE id IN (SELECT DISTINCT user_id FROM invoices)
    """)

    # For users who have has_donated=true but no invoices, set last_donated to 2023-01-01
    op.execute("""
        UPDATE users
        SET last_donated = '2023-01-01 00:00:00+00'::timestamptz
        WHERE has_donated = true
        AND last_donated IS NULL
    """)

    op.drop_column("users", "has_donated")


def downgrade() -> None:
    op.add_column(
        "users",
        sa.Column("has_donated", sa.BOOLEAN(), server_default=sa.text("false"), autoincrement=False, nullable=False),
    )
    op.drop_column("users", "last_donated")
    op.drop_column("invoices", "invoice_type")
    # Drop the enum type
    sa.Enum("on_platform", "external_shop", name="invoicetype").drop(op.get_bind(), checkfirst=True)
