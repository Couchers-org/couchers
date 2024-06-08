"""Added is_cancelled and is_deleted for Events and update notification action enum

Revision ID: 46e6b6a3d9ed
Revises: 88b6bb559332
Create Date: 2024-05-16 00:44:01.904266

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "46e6b6a3d9ed"
down_revision = "bc79d9a6fd26"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "event_occurrences", sa.Column("is_cancelled", sa.Boolean(), nullable=False, server_default=sa.text("false"))
    )
    op.add_column(
        "event_occurrences", sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false"))
    )
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'event__cancel'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'event__delete'")


def downgrade():
    # op.drop_column("event_occurrences", "is_deleted")
    # op.drop_column("event_occurrences", "is_cancelled")
    raise Exception("Can't downgrade")
