"""Add rate limit violations

Revision ID: 0099
Revises: 0098
Create Date: 2025-07-01 18:28:06.294098

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0099"
down_revision = "0098"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "rate_limit_violations",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "action",
            sa.Enum("host_request", "friend_request", "chat_initiation", name="ratelimitaction"),
            nullable=False,
        ),
        sa.Column("is_hard_limit", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_rate_limit_violations_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_rate_limit_violations")),
    )
    op.create_index(
        "ix_rate_limits_by_user",
        "rate_limit_violations",
        ["user_id", "action", "is_hard_limit", "created"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_rate_limits_by_user", table_name="rate_limit_violations")
    op.drop_table("rate_limit_violations")
