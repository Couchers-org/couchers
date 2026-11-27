"""Add the session_touches table

Revision ID: 0212
Revises: 0211
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0212"
down_revision = "0211"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "session_touches",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("token", sa.String(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("time", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("ip_address", postgresql.INET(), nullable=True),
        sa.Column("user_agent", sa.String(), nullable=True),
        sa.Column("sofa", sa.String(), nullable=True),
        sa.Column(
            "client_platform",
            postgresql.ENUM(
                "web_desktop", "web_mobile", "app_ios", "app_android", name="clientplatform", create_type=False
            ),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_session_touches")),
    )
    op.create_index("ix_session_touches_token", "session_touches", ["token"], unique=False)


def downgrade() -> None:
    op.drop_table("session_touches")
