"""Add new user rate limits

Revision ID: 815584d93945
Revises: 941b04198efe
Create Date: 2025-11-21 00:21:08.087137

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "815584d93945"
down_revision = "941b04198efe"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'new_user_host_request'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'new_user_friend_request'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'new_user_chat_initiation'")


def downgrade():
    raise Exception("Can't downgrade")
