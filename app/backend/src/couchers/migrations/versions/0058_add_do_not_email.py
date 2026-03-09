"""Add do not email

Revision ID: 0058
Revises: 0057
Create Date: 2024-05-03 16:46:22.121003

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0058"
down_revision = "0057"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("do_not_email", sa.Boolean(), server_default=sa.text("false"), nullable=False))
    op.create_check_constraint(
        constraint_name="do_not_email_inactive",
        table_name="users",
        condition="(do_not_email IS FALSE) OR ((new_notifications_enabled IS FALSE) AND (hosting_status = 'cant_host') AND (meetup_status = 'does_not_want_to_meetup'))",
    )


def downgrade() -> None:
    raise Exception("Can't downgrade")
