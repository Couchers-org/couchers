"""Add antibot

Revision ID: 0097
Revises: 0096
Create Date: 2025-06-28 11:45:33.996222

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0097"
down_revision = "0096"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "antibot_logs",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=True),
        sa.Column("ip_address", sa.String(), nullable=True),
        sa.Column("user_agent", sa.String(), nullable=True),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("token", sa.String(), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("provider_data", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_antibot_logs_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_antibot_logs")),
    )


def downgrade() -> None:
    op.drop_table("antibot_logs")
