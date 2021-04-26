"""Fix slugify

Revision ID: 2d656b6ad999
Revises: 723394ace6b5
Create Date: 2021-04-25 15:43:19.995784

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "2d656b6ad999"
down_revision = "723394ace6b5"
branch_labels = None
depends_on = None


def upgrade():
    # slugify takes an arbitrary piece of text and turns it into a "slug" by replacing occurences of non-alphanumber
    # characters with dashes, truncating, and then cleaning that up. We attempt to turn non-ascii characters to close
    # ascii characters with unaccent. Slugs are useful in URLs, giving users a preview yet being URL "nice".
    # e.g. slugify('Detta är ett test!') -> detta-ar-ett-test
    op.execute(
        r"""
    CREATE OR REPLACE FUNCTION slugify("text" TEXT)
    RETURNS TEXT AS $$
    SELECT regexp_replace(
      regexp_replace(
        substring(
          regexp_replace(
            lower(unaccent("text")),
            '[^a-z0-9]+', '-', 'gi'
          ) from 0 for 64
        ), '-$', ''
      ), '^-', ''
    );
    $$ LANGUAGE SQL STRICT IMMUTABLE;
    """
    )


def downgrade():
    pass
