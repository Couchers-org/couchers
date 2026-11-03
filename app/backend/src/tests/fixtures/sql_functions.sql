-- in tests we don't always run migrations, which would create these, so we'll put it here

CREATE EXTENSION IF NOT EXISTS "unaccent";

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

CREATE OR REPLACE FUNCTION immutable_unaccent(input_text TEXT)
RETURNS TEXT AS $$
SELECT public.unaccent(input_text);
$$ LANGUAGE sql STRICT IMMUTABLE;

CREATE OR REPLACE FUNCTION gb_fnv1a32(s TEXT)
RETURNS BIGINT AS $$
DECLARE
  b BYTEA := convert_to(s, 'UTF8');
  h BIGINT := 2166136261;
BEGIN
  FOR i IN 0 .. length(b) - 1 LOOP
    h := ((h # get_byte(b, i)) * 16777619) & 4294967295;
  END LOOP;
  RETURN h;
END
$$ LANGUAGE plpgsql STRICT IMMUTABLE PARALLEL SAFE;

CREATE OR REPLACE FUNCTION gb_bucket(seed TEXT, value TEXT)
RETURNS DOUBLE PRECISION AS $$
SELECT (gb_fnv1a32(gb_fnv1a32(seed || value)::TEXT) % 10000) / 10000::DOUBLE PRECISION;
$$ LANGUAGE sql STRICT IMMUTABLE PARALLEL SAFE;
