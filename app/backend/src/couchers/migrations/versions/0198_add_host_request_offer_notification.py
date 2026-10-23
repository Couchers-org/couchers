"""Add host_request__offer to NotificationTopicAction

Revision ID: 0198
Revises: 0197
Create Date: 2026-10-19 00:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0198"
down_revision = "0197"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE IF NOT EXISTS 'host_request__offer'")


def downgrade() -> None:
    raise Exception("Can't downgrade")
