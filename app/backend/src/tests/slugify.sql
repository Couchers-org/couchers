-- in tests we don't always run migrations, which would create these, so we'll put it here

CREATE EXTENSION IF NOT EXISTS "unaccent";

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
