"""Make user_activity unique index treat NULLs as not distinct

Revision ID: 0160
Revises: 0159
Create Date: 2026-05-30 16:30:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0160"
down_revision = "0159"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_index("ix_user_activity_user_id_period_ip_address_user_agent_sofa", table_name="user_activity")
    op.execute(
        "CREATE UNIQUE INDEX ix_user_activity_user_id_period_ip_address_user_agent_sofa "
        "ON user_activity (user_id, period, ip_address, user_agent, sofa) NULLS NOT DISTINCT"
    )


def downgrade() -> None:
    op.drop_index("ix_user_activity_user_id_period_ip_address_user_agent_sofa", table_name="user_activity")
    op.execute(
        "CREATE UNIQUE INDEX ix_user_activity_user_id_period_ip_address_user_agent_sofa "
        "ON user_activity (user_id, period, ip_address, user_agent, sofa)"
    )
