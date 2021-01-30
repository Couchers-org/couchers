"""Add signup token purge job type

Revision ID: e3de5d6248b0
Revises: 9ee63fbcbca7
Create Date: 2021-01-30 15:34:30.678772

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "e3de5d6248b0"
down_revision = "9ee63fbcbca7"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE backgroundjobtype ADD VALUE 'purge_signup_tokens';")


def downgrade():
    raise Exception("I can't drop the 'purge_signup_tokens' value from 'backgroundjobtype' enum.")
