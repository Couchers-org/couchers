"""Notify v2.1

Revision ID: bc79d9a6fd26
Revises: ed8f8aad559c
Create Date: 2024-06-03 23:31:54.196399

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "bc79d9a6fd26"
down_revision = "ed8f8aad559c"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("push_notification_subscriptions", sa.Column("user_agent", sa.String(), nullable=True))
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'reference__receive_friend'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'reference__receive_hosted'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'reference__receive_surfed'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'reference__reminder_hosted'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'reference__reminder_surfed'")


def downgrade():
    raise Exception("Can't downgrade")
