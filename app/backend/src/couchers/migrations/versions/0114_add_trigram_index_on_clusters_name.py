"""add trigram index on clusters.name

Revision ID: 91bd06f6a96a
Revises: 8c878b177151
Create Date: 2025-09-20 16:19:08.556531

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "91bd06f6a96a"
down_revision = "8c878b177151"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE OR REPLACE FUNCTION immutable_unaccent(input_text TEXT)
        RETURNS TEXT AS $$
        SELECT public.unaccent(input_text);
        $$ LANGUAGE sql STRICT IMMUTABLE;

        CREATE INDEX idx_clusters_name_unaccented_trgm
        ON clusters
        USING gin (immutable_unaccent(name) gin_trgm_ops);
        """)


def downgrade() -> None:
    op.execute("""
    DROP INDEX idx_clusters_name_unaccented_trgm;

    DROP FUNCTION immutable_unaccent;
    """)
