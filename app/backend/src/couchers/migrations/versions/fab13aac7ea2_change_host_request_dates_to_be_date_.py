"""Change host request dates to be date objects

Revision ID: fab13aac7ea2
Revises: 17362f602f12
Create Date: 2021-03-17 14:43:55.530474

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "fab13aac7ea2"
down_revision = "17362f602f12"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE host_requests ALTER COLUMN from_date TYPE DATE USING to_date(from_date, 'YYYY-MM-DD')")
    op.execute("ALTER TABLE host_requests ALTER COLUMN to_date TYPE DATE USING to_date(to_date, 'YYYY-MM-DD')")


def downgrade():
    op.execute("ALTER TABLE host_requests ALTER COLUMN from_date TYPE VARCHAR USING from_date::text")
    op.execute("ALTER TABLE host_requests ALTER COLUMN to_date TYPE VARCHAR USING to_date::text")
