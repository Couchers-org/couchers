"""Add blog post notifs

Revision ID: 0090
Revises: 0089
Create Date: 2025-05-18 16:32:03.569192

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0090"
down_revision = "0089"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'general__new_blog_post'")


def downgrade() -> None:
    raise Exception("Can't downgrade")
