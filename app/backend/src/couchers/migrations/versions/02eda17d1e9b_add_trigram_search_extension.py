"""Add trigram search extension

Revision ID: 02eda17d1e9b
Revises: 05bf320ed680
Create Date: 2021-02-22 10:11:07.966579

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "02eda17d1e9b"
down_revision = "05bf320ed680"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")


def downgrade():
    op.execute("DROP EXTENSION pg_trgm")
