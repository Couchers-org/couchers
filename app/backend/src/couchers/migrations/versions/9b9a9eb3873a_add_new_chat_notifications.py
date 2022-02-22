"""Add new chat notifications

Revision ID: 9b9a9eb3873a
Revises: e96f385d0f66
Create Date: 2022-02-01 12:09:28.002201

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "9b9a9eb3873a"
down_revision = "e96f385d0f66"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE backgroundjobtype ADD VALUE 'generate_message_notifications'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'chat__message'")


def downgrade():
    pass
