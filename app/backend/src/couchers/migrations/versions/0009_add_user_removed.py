"""Add user_removed

Revision ID: 0009
Revises: 0008
Create Date: 2021-05-13 15:48:22.513281

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE messagetype ADD VALUE 'user_removed'")


def downgrade() -> None:
    pass
