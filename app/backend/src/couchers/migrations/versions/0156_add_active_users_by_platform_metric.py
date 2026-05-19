"""Add active users by platform metric

Revision ID: 0156
Revises: 0155
Create Date: 2026-05-19 13:57:38.938396

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0156"
down_revision = "0155"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user_activity", sa.Column("sofa", sa.String(), nullable=True))
    op.add_column(
        "user_activity",
        sa.Column(
            "client_platform",
            sa.Enum("web_desktop", "web_mobile", "app_ios", "app_android", name="clientplatform"),
            nullable=True,
        ),
    )
    op.drop_index(op.f("ix_user_activity_user_id_period_ip_address_user_agent"), table_name="user_activity")
    op.create_index(
        "ix_user_activity_user_id_period_ip_address_user_agent_sofa",
        "user_activity",
        ["user_id", "period", "ip_address", "user_agent", "sofa"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_user_activity_user_id_period_ip_address_user_agent_sofa", table_name="user_activity")
    op.create_index(
        op.f("ix_user_activity_user_id_period_ip_address_user_agent"),
        "user_activity",
        ["user_id", "period", "ip_address", "user_agent"],
        unique=True,
    )
    op.drop_column("user_activity", "client_platform")
    op.drop_column("user_activity", "sofa")
