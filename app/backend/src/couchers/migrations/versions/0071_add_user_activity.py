"""Add user activity

Revision ID: 0071
Revises: 0070
Create Date: 2024-09-24 21:18:41.438200

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0071"
down_revision = "0070"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_activity",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("period", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ip_address", postgresql.INET(), nullable=True),
        sa.Column("user_agent", sa.String(), nullable=True),
        sa.Column("api_calls", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_user_activity_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_user_activity")),
    )
    op.create_index(
        "ix_user_activity_user_id_period_ip_address_user_agent",
        "user_activity",
        ["user_id", "period", "ip_address", "user_agent"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_user_activity_user_id_period_ip_address_user_agent", table_name="user_activity")
    op.drop_table("user_activity")
