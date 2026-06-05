"""Add user_email_campaign_sends table

Revision ID: 0190
Revises: 0189
Create Date: 2026-06-01 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

revision = "0190"
down_revision = "0189"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'host_my_home__nudge'")

    op.create_table(
        "user_email_campaign_sends",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("campaign_key", sa.String(), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_user_email_campaign_sends_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_user_email_campaign_sends")),
        sa.UniqueConstraint("user_id", "campaign_key", name="uq_user_email_campaign_sends_user_id_campaign_key"),
    )
    op.create_index("ix_user_email_campaign_sends_campaign_key", "user_email_campaign_sends", ["campaign_key"])


def downgrade() -> None:
    op.drop_index("ix_user_email_campaign_sends_campaign_key", table_name="user_email_campaign_sends")
    op.drop_table("user_email_campaign_sends")
