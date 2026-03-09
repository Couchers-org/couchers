"""Make contribute_ways a non-null array

Revision ID: 0029
Revises: 0028
Create Date: 2021-09-06 11:31:50.349578

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0029"
down_revision = "0028"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE contributor_forms SET contribute_ways = '{}' WHERE contribute_ways IS NULL")
    op.alter_column("contributor_forms", "contribute_ways", nullable=False)


def downgrade() -> None:
    op.alter_column("contributor_forms", "contribute_ways", nullable=True)
