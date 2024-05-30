"""Notify v2

Revision ID: ed8f8aad559c
Revises: 3b63c4706f0d
Create Date: 2024-05-29 20:42:43.642178

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "ed8f8aad559c"
down_revision = "3b63c4706f0d"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("notifications", sa.Column("data", sa.LargeBinary(), nullable=False))
    op.drop_column("notifications", "content")
    op.drop_column("notifications", "link")
    op.drop_column("notifications", "icon")
    op.drop_column("notifications", "avatar_key")
    op.drop_column("notifications", "title")
    op.execute("ALTER TYPE notificationtopicaction RENAME VALUE 'friend_request__send' TO 'friend_request__create'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'email_address__verify'")


def downgrade():
    raise Exception("Can't downgrade")
