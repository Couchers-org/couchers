"""Backend: map eas-client-id to last-authenticated user_id

Revision ID: 0163
Revises: 0162
Create Date: 2026-06-02 02:28:47.206018

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0163"
down_revision = "0162"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "native_client_users",
        sa.Column("eas_client_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("last_seen", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_native_client_users_user_id_users")),
        sa.PrimaryKeyConstraint("eas_client_id", name=op.f("pk_native_client_users")),
    )
    op.create_index(op.f("ix_native_client_users_user_id"), "native_client_users", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_native_client_users_user_id"), table_name="native_client_users")
    op.drop_table("native_client_users")
