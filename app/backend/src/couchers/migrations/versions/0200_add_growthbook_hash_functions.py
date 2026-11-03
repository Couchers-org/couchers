"""Add GrowthBook hash functions for evaluating flags in SQL

Revision ID: 0200
Revises: 0199
Create Date: 2026-10-24 00:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0200"
down_revision = "0199"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
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
        """)


def downgrade() -> None:
    op.execute("""
        DROP FUNCTION gb_bucket;
        DROP FUNCTION gb_fnv1a32;
        """)
