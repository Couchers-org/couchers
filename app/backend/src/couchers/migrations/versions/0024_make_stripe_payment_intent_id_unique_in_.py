"""Make stripe_payment_intent_id unique in invoices table

Revision ID: 0024
Revises: 0023
Create Date: 2021-07-22 23:24:50.137340

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0024"
down_revision = "0023"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_unique_constraint(op.f("uq_invoices_stripe_payment_intent_id"), "invoices", ["stripe_payment_intent_id"])


def downgrade() -> None:
    op.drop_constraint(op.f("uq_invoices_stripe_payment_intent_id"), "invoices", type_="unique")
