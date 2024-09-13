"""Add opt out of newsletter

Revision ID: c7079437149a
Revises: d45f557f87e8
Create Date: 2024-05-19 16:15:00.273193

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "c7079437149a"
down_revision = "d45f557f87e8"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("signup_flows", sa.Column("opt_out_of_newsletter", sa.Boolean(), nullable=True))
    op.alter_column("users", "added_to_mailing_list", new_column_name="in_sync_with_newsletter")
    op.add_column("users", sa.Column("opt_out_of_newsletter", sa.Boolean(), server_default="false", nullable=False))


def downgrade():
    raise Exception("Can't downgrade")
