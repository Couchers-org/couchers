"""Notify v2.2

Revision ID: f53ecea60964
Revises: 49669627f688
Create Date: 2024-06-11 21:43:29.125853

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "f53ecea60964"
down_revision = "49669627f688"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'chat__missed_messages'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'onboarding__reminder'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'host_request__missed_messages'")


def downgrade():
    raise Exception("Can't downgrade")
