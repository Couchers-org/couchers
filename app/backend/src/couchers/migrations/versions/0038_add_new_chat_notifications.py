"""Add new chat notifications

Revision ID: 0038
Revises: 0037
Create Date: 2022-02-01 12:09:28.002201

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0038"
down_revision = "0037"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE backgroundjobtype ADD VALUE 'generate_message_notifications'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'chat__message'")


def downgrade() -> None:
    pass
