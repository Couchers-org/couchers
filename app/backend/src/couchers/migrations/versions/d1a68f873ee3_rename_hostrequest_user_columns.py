"""Rename HostRequest user columns

Revision ID: d1a68f873ee3
Revises: 62fcd41e4dcd
Create Date: 2021-07-13 01:47:30.120271

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "d1a68f873ee3"
down_revision = "62fcd41e4dcd"
branch_labels = None
depends_on = None


def upgrade():
    ### Manually generated
    op.alter_column("host_requests", "from_user_id", new_column_name="surfer_id")
    op.alter_column("host_requests", "to_user_id", new_column_name="host_id")
    op.alter_column("host_requests", "to_last_seen_message_id", new_column_name="host_last_seen_message_id")
    op.alter_column("host_requests", "from_last_seen_message_id", new_column_name="surfer_last_seen_message_id")


def downgrade():
    pass
