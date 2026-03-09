"""Add thread notifications

Revision ID: 0084
Revises: 0083
Create Date: 2024-09-07 22:41:29.750442

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0084"
down_revision = "0083"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'event__comment'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'discussion__create'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'discussion__comment'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'thread__reply'")


def downgrade() -> None:
    raise Exception("Can't downgrade")
