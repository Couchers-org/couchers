"""is_deleted on reference

Revision ID: 20842baa0c53
Revises: 33944292a259
Create Date: 2025-03-12 21:16:53.707189

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "20842baa0c53"
down_revision = "33944292a259"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("references", sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    op.drop_column("references", "is_deleted")
