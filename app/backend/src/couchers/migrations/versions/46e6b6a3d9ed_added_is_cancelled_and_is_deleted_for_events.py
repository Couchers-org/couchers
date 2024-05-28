"""Added is_cancelled and is_deleted for Events

Revision ID: 46e6b6a3d9ed
Revises: 88b6bb559332
Create Date: 2024-05-16 00:44:01.904266

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "46e6b6a3d9ed"
down_revision = "3b63c4706f0d"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "event_occurrences", sa.Column("is_cancelled", sa.Boolean(), nullable=False, server_default=sa.text("false"))
    )
    op.add_column(
        "event_occurrences", sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false"))
    )


def downgrade():
    op.drop_column("event_occurrences", "is_deleted")
    op.drop_column("event_occurrences", "is_cancelled")
