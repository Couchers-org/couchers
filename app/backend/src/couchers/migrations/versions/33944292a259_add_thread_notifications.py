"""Add thread notifications

Revision ID: 33944292a259
Revises: 99aece5bdc42
Create Date: 2024-09-07 22:41:29.750442

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "33944292a259"
down_revision = "99aece5bdc42"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'event__comment'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'discussion__create'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'discussion__comment'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'thread__reply'")


def downgrade():
    raise Exception("Can't downgrade")
