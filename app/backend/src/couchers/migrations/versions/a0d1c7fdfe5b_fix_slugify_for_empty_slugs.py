"""Fix slugify for empty slugs

Revision ID: a0d1c7fdfe5b
Revises: 2630bc1387d1
Create Date: 2022-01-25 13:38:57.268462

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "a0d1c7fdfe5b"
down_revision = "2630bc1387d1"
branch_labels = None
depends_on = None


def upgrade():
    # slugify takes an arbitrary piece of text and turns it into a "slug" by replacing occurences of non-alphanumber
    # characters with dashes, truncating, and then cleaning that up. We attempt to turn non-ascii characters to close
    # ascii characters with unaccent. Slugs are useful in URLs, giving users a preview yet being URL "nice". If the slug
    # ends up empty after these transformations, we replace it with "slug"
    # e.g. slugify('Detta är ett test!') -> detta-ar-ett-test
    op.execute(
        r"""
    CREATE OR REPLACE FUNCTION slugify("text" TEXT)
    RETURNS TEXT AS $$
    SELECT regexp_replace(
      regexp_replace(
        regexp_replace(
          substring(
            regexp_replace(
              lower(unaccent("text")),
              '[^a-z0-9]+', '-', 'gi'
            ) from 0 for 64
          ), '-$', ''
        ), '^-', ''
      ), '^$', 'slug'
    );
    $$ LANGUAGE SQL STRICT IMMUTABLE;
    """
    )


def downgrade():
    pass
