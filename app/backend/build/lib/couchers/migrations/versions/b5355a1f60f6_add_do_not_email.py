"""Add do not email

Revision ID: b5355a1f60f6
Revises: 1c999dea180d
Create Date: 2024-05-03 16:46:22.121003

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "b5355a1f60f6"
down_revision = "1c999dea180d"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("do_not_email", sa.Boolean(), server_default=sa.text("false"), nullable=False))
    op.create_check_constraint(
        constraint_name="do_not_email_inactive",
        table_name="users",
        condition="(do_not_email IS FALSE) OR ((new_notifications_enabled IS FALSE) AND (hosting_status = 'cant_host') AND (meetup_status = 'does_not_want_to_meetup'))",
    )


def downgrade():
    raise Exception("Can't downgrade")
