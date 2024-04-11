"""Add new notification types

Revision ID: 1c999dea180d
Revises: b9791722e1c0
Create Date: 2024-04-11 10:00:14.627154

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "1c999dea180d"
down_revision = "b9791722e1c0"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'event__create'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'event__update'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'event__invite_organizer'")


def downgrade():
    raise Exception("Can't downgrade")
