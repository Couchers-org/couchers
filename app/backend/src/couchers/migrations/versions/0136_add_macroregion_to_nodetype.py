"""Add macroregion to nodetype enum

Revision ID: 0136
Revises: 0135
Create Date: 2026-02-18 22:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0136"
down_revision = "0135"
branch_labels = None
depends_on = None


def upgrade():
    # This COMMIT is redundant: ADD VALUE works fine inside a transaction; only *using* the new value before
    # commit is disallowed, which this migration doesn't do. Kept as-is since it has already run.
    op.execute("COMMIT")
    op.execute("ALTER TYPE nodetype ADD VALUE IF NOT EXISTS 'macroregion' AFTER 'world'")


def downgrade():
    # Remap any macroregion nodes to region before dropping the enum value
    op.execute("UPDATE nodes SET node_type = 'region' WHERE node_type = 'macroregion'")
    # PostgreSQL doesn't support removing enum values, so we recreate the enum
    op.execute("ALTER TYPE nodetype RENAME TO nodetype_old")
    op.execute("CREATE TYPE nodetype AS ENUM ('world', 'region', 'subregion', 'locality', 'sublocality')")
    op.execute("ALTER TABLE nodes ALTER COLUMN node_type TYPE nodetype USING node_type::text::nodetype")
    op.execute("DROP TYPE nodetype_old")
