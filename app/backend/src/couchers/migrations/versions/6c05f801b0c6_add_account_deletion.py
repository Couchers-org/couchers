"""Add account deletion

Revision ID: 6c05f801b0c6
Revises: 9b9a9eb3873a
Create Date: 2022-02-06 23:41:48.605455

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "6c05f801b0c6"
down_revision = "9b9a9eb3873a"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "account_deletion_tokens",
        sa.Column("token", sa.String(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("expiry", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_account_deletion_tokens_user_id_users")),
        sa.PrimaryKeyConstraint("token", name=op.f("pk_account_deletion_tokens")),
    )
    op.create_index(op.f("ix_account_deletion_tokens_user_id"), "account_deletion_tokens", ["user_id"], unique=False)
    op.create_table(
        "account_deletion_reason",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("reason", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_account_deletion_reason_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_account_deletion_reason")),
    )
    op.add_column("users", sa.Column("undelete_token", sa.String(), nullable=True))
    op.add_column("users", sa.Column("undelete_until", sa.DateTime(timezone=True), nullable=True))
    op.create_check_constraint(
        constraint_name="undelete_nullity",
        table_name="users",
        condition="((undelete_token IS NULL) = (undelete_until IS NULL)) AND ((undelete_token IS NULL) OR is_deleted)",
    )
    op.execute("ALTER TYPE backgroundjobtype ADD VALUE 'purge_account_deletion_tokens'")
    op.execute("ALTER TYPE backgroundjobtype ADD VALUE 'purge_password_reset_tokens'")


def downgrade():
    op.drop_constraint("undelete_nullity")
    op.drop_column("users", "undelete_until")
    op.drop_column("users", "undelete_token")
    op.drop_table("account_deletion_reason")
    op.drop_index(op.f("ix_account_deletion_tokens_user_id"), table_name="account_deletion_tokens")
    op.drop_table("account_deletion_tokens")
