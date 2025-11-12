"""add_invoice_type_to_invoices

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


def upgrade():
    # Create the enum types for donations and merch
    invoicetype_enum = sa.Enum("donation", "merch", name="invoicetype")
    invoicetype_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "invoices",
        sa.Column("invoice_type", invoicetype_enum, nullable=False, server_default="donation"),
    )
    # Remove server default after column is created (for future inserts, code must specify type)
    op.alter_column("invoices", "invoice_type", server_default=None)


def downgrade():
    op.drop_column("invoices", "invoice_type")
    # Drop the enum type
    sa.Enum("donation", "merch", name="invoicetype").drop(op.get_bind(), checkfirst=True)
