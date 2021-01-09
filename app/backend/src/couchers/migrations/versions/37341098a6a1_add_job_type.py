"""Add job type

Revision ID: 37341098a6a1
Revises: 03cefb74b370
Create Date: 2021-01-09 19:40:31.058192

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "37341098a6a1"
down_revision = "03cefb74b370"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE backgroundjobtype ADD VALUE 'purge_login_tokens';")


def downgrade():
    raise Exception("I can't drop the 'purge_login_tokens' value from 'backgroundjobtype' enum.")
