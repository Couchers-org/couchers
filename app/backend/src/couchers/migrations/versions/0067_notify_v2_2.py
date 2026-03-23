"""Notify v2.2

Revision ID: 0067
Revises: 0066
Create Date: 2024-06-11 21:43:29.125853

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0067"
down_revision = "0066"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'chat__missed_messages'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'onboarding__reminder'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'host_request__missed_messages'")


def downgrade() -> None:
    raise Exception("Can't downgrade")
