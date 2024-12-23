"""add deleted to clusters, nodes, pages, page_versions

Revision ID: e839abb5fa15
Revises: a84888e4cb0a
Create Date: 2024-12-18 11:41:17.896155

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "e839abb5fa15"
down_revision = "a84888e4cb0a"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("clusters", sa.Column("deleted", postgresql.TIMESTAMP(timezone=True), nullable=True))
    op.add_column("nodes", sa.Column("deleted", postgresql.TIMESTAMP(timezone=True), nullable=True))
    op.add_column("pages", sa.Column("deleted", postgresql.TIMESTAMP(timezone=True), nullable=True))
    op.add_column("page_versions", sa.Column("deleted", postgresql.TIMESTAMP(timezone=True), nullable=True))


def downgrade():
    op.drop_column("clusters", "deleted")
    op.drop_column("nodes", "deleted")
    op.drop_column("pages", "deleted")
    op.drop_column("page_versions", "deleted")
