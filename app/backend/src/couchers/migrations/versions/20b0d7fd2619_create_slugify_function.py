"""Create slugify function

Revision ID: 20b0d7fd2619
Revises: 2affc63b4a01
Create Date: 2021-01-29 16:35:16.092332

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "20b0d7fd2619"
down_revision = "2affc63b4a01"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
    CREATE EXTENSION IF NOT EXISTS "unaccent";

    CREATE OR REPLACE FUNCTION slugify("text" TEXT)
    RETURNS TEXT AS $$
    SELECT regexp_replace(
    regexp_replace(
        substring(
        regexp_replace(
            lower(unaccent("text")),
            '[^a-z0-9\\-_]+', '-', 'gi')
        from 0 for 64),
        '\-+$', ''),
    '^\-', '');
    $$ LANGUAGE SQL STRICT IMMUTABLE;
    """
    )


def downgrade():
    op.execute("DROP FUNCTION slugify")
