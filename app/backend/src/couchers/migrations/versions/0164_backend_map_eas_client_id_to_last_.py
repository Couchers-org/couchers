"""Backend: map eas-client-id to last-authenticated user_id

Revision ID: 0164
Revises: 0163
Create Date: 2026-06-02 02:34:30.660517

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0164"
down_revision = "0163"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "native_client_users",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("time", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("eas_client_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_native_client_users_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_native_client_users")),
    )
    op.create_index(
        op.f("ix_native_client_users_eas_client_id"), "native_client_users", ["eas_client_id"], unique=False
    )
    op.create_index(op.f("ix_native_client_users_user_id"), "native_client_users", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_native_client_users_user_id"), table_name="native_client_users")
    op.drop_index(op.f("ix_native_client_users_eas_client_id"), table_name="native_client_users")
    op.drop_table("native_client_users")
