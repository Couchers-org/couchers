"""Add blog post notifs

Revision ID: 07ecff50fe93
Revises: a0d344cfb455
Create Date: 2025-05-18 16:32:03.569192

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "07ecff50fe93"
down_revision = "a0d344cfb455"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'general__new_blog_post'")


def downgrade() -> None:
    raise Exception("Can't downgrade")
