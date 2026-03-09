"""Add SMS log

Revision ID: 0034
Revises: 0033
Create Date: 2022-01-15 20:33:25.586641

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0034"
down_revision = "0033"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "smss",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("time", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("message_id", sa.String(), nullable=False),
        sa.Column("sms_sender_id", sa.String(), nullable=False),
        sa.Column("number", sa.String(), nullable=False),
        sa.Column("message", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_smss")),
    )


def downgrade() -> None:
    op.drop_table("smss")
