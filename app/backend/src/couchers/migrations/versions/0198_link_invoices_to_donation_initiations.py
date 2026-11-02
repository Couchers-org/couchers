"""Link invoices to donation initiations and record their frequency

Revision ID: 0198
Revises: 0197
Create Date: 2026-10-21 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0198"
down_revision = "0197"
branch_labels = None
depends_on = None

donation_type_enum = postgresql.ENUM("one_time", "monthly", "yearly", name="donationtype", create_type=False)


def upgrade() -> None:
    op.add_column("invoices", sa.Column("donation_initiation_id", sa.BigInteger(), nullable=True))
    op.add_column("invoices", sa.Column("donation_type", donation_type_enum, nullable=True))
    op.create_foreign_key(
        op.f("fk_invoices_donation_initiation_id_donation_initiations"),
        "invoices",
        "donation_initiations",
        ["donation_initiation_id"],
        ["id"],
    )
    op.create_index(op.f("ix_invoices_donation_initiation_id"), "invoices", ["donation_initiation_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_invoices_donation_initiation_id"), table_name="invoices")
    op.drop_constraint(op.f("fk_invoices_donation_initiation_id_donation_initiations"), "invoices", type_="foreignkey")
    op.drop_column("invoices", "donation_type")
    op.drop_column("invoices", "donation_initiation_id")
