"""Add donation tables

Revision ID: e6d03b494119
Revises: 5e89dd9ef181
Create Date: 2021-06-25 17:11:45.036411

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "e6d03b494119"
down_revision = "5e89dd9ef181"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "invoices",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("stripe_payment_intent_id", sa.String(), nullable=False),
        sa.Column("stripe_receipt_url", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_invoices_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_invoices")),
    )
    op.create_table(
        "one_time_donations",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("stripe_checkout_session_id", sa.String(), nullable=False),
        sa.Column("stripe_payment_intent_id", sa.String(), nullable=False),
        sa.Column("paid", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_one_time_donations_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_one_time_donations")),
    )
    op.create_index(op.f("ix_one_time_donations_user_id"), "one_time_donations", ["user_id"], unique=False)
    op.create_table(
        "recurring_donations",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("stripe_checkout_session_id", sa.String(), nullable=False),
        sa.Column("stripe_subscription_id", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_recurring_donations_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_recurring_donations")),
    )
    op.add_column("users", sa.Column("stripe_customer_id", sa.String(), nullable=True))


def downgrade():
    op.drop_column("users", "stripe_customer_id")
    op.drop_table("recurring_donations")
    op.drop_index(op.f("ix_one_time_donations_user_id"), table_name="one_time_donations")
    op.drop_table("one_time_donations")
    op.drop_table("invoices")
