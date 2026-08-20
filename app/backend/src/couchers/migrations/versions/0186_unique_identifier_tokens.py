"""Unique tokens and stripe customer id

Revision ID: 0186
Revises: 0185
Create Date: 2026-08-19 12:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0186"
down_revision = "0185"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.create_index(
            "ix_users_unique_undelete_token",
            "users",
            ["undelete_token"],
            unique=True,
            postgresql_where="undelete_token IS NOT NULL",
            postgresql_concurrently=True,
            if_not_exists=True,
        )
        op.create_index(
            "ix_users_unique_new_email_token",
            "users",
            ["new_email_token"],
            unique=True,
            postgresql_where="new_email_token IS NOT NULL",
            postgresql_concurrently=True,
            if_not_exists=True,
        )
        op.create_index(
            "ix_users_unique_stripe_customer_id",
            "users",
            ["stripe_customer_id"],
            unique=True,
            postgresql_where="stripe_customer_id IS NOT NULL",
            postgresql_concurrently=True,
            if_not_exists=True,
        )
    op.create_unique_constraint("uq_signup_flows_email_token", "signup_flows", ["email_token"])


def downgrade() -> None:
    op.drop_constraint("uq_signup_flows_email_token", "signup_flows", type_="unique")
    with op.get_context().autocommit_block():
        op.drop_index(
            "ix_users_unique_stripe_customer_id",
            table_name="users",
            postgresql_concurrently=True,
            if_exists=True,
        )
        op.drop_index(
            "ix_users_unique_new_email_token",
            table_name="users",
            postgresql_concurrently=True,
            if_exists=True,
        )
        op.drop_index(
            "ix_users_unique_undelete_token",
            table_name="users",
            postgresql_concurrently=True,
            if_exists=True,
        )
