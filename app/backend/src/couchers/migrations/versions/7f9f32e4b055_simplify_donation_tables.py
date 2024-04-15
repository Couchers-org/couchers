"""Simplify donation tables

Revision ID: 7f9f32e4b055
Revises: b9791722e1c0
Create Date: 2024-04-13 16:22:48.637928

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "7f9f32e4b055"
down_revision = "b9791722e1c0"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "donation_initiations",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("stripe_checkout_session_id", sa.String(), nullable=False),
        sa.Column("donation_type", sa.Enum("one_time", "recurring", name="donationtype"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_donation_initiations_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_donation_initiations")),
    )
    op.create_index(op.f("ix_donation_initiations_user_id"), "donation_initiations", ["user_id"], unique=False)
    op.execute(
        """
        INSERT INTO donation_initiations (id, created, user_id, amount, stripe_checkout_session_id, donation_type)
        SELECT
            ROW_NUMBER() OVER (ORDER BY created) AS id,
            created, user_id, amount, stripe_checkout_session_id, dtype
        FROM (
            SELECT created, user_id, amount, stripe_checkout_session_id, 'one_time'::donationtype AS dtype FROM one_time_donations
            UNION ALL
            SELECT created, user_id, amount, stripe_checkout_session_id, 'recurring'::donationtype AS dtype FROM recurring_donations
        ) AS t
        """
    )
    op.drop_table("recurring_donations")
    op.drop_table("one_time_donations")


def downgrade():
    raise Exception("Can't downgrade")
