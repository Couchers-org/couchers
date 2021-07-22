"""Make stripe_payment_intent_id unique in invoices table

Revision ID: e938e80b67a4
Revises: 61b4c6b2df72
Create Date: 2021-07-22 23:24:50.137340

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "e938e80b67a4"
down_revision = "61b4c6b2df72"
branch_labels = None
depends_on = None


def upgrade():
    op.create_unique_constraint(op.f("uq_invoices_stripe_payment_intent_id"), "invoices", ["stripe_payment_intent_id"])


def downgrade():
    op.drop_constraint(op.f("uq_invoices_stripe_payment_intent_id"), "invoices", type_="unique")
