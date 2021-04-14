"""Create slugify function

Revision ID: 20b0d7fd2619
Revises: b93d0f73a1d3
Create Date: 2021-01-29 16:35:16.092332

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "20b0d7fd2619"
down_revision = "b93d0f73a1d3"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        r"""
    CREATE EXTENSION IF NOT EXISTS "unaccent";

    -- slugify takes an arbitrary piece of text and turns it into a "slug" by replacing occurences of non-alphanumber
    -- characters with dashes, truncating, and then cleaning that up. We attempt to turn non-ascii characters to close
    -- ascii characters with unaccent. Slugs are useful in URLs, giving users a preview yet being URL "nice".
    -- e.g. slugify('Detta är ett test!') -> detta-ar-ett-test
    CREATE OR REPLACE FUNCTION slugify("text" TEXT)
    RETURNS TEXT AS $$
    SELECT regexp_replace(
      regexp_replace(
        substring(
          regexp_replace(
            lower(unaccent("text")),
            '[^a-z0-9_-]+', '-', 'gi'
          ) from 0 for 64
        ), '\-+$', ''
      ), '^\-', ''
    );
    $$ LANGUAGE SQL STRICT IMMUTABLE;
    """
    )


def downgrade():
    op.execute("DROP FUNCTION slugify")
