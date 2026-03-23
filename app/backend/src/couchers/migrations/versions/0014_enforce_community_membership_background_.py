"""enforce_community_membership_background_job

Revision ID: 0014
Revises: 0013
Create Date: 2021-06-05 11:24:10.551584

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0014"
down_revision = "0013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE backgroundjobtype ADD VALUE 'enforce_community_membership'")


def downgrade() -> None:
    pass
