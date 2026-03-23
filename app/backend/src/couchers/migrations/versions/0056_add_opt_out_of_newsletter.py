"""Add opt out of newsletter

Revision ID: 0056
Revises: 0055
Create Date: 2024-05-19 16:15:00.273193

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0056"
down_revision = "0055"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("signup_flows", sa.Column("opt_out_of_newsletter", sa.Boolean(), nullable=True))
    op.alter_column("users", "added_to_mailing_list", new_column_name="in_sync_with_newsletter")
    op.add_column("users", sa.Column("opt_out_of_newsletter", sa.Boolean(), server_default="false", nullable=False))


def downgrade() -> None:
    raise Exception("Can't downgrade")
