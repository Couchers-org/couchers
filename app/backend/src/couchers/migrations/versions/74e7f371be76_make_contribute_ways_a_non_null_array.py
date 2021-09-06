"""Make contribute_ways a non-null array

Revision ID: 74e7f371be76
Revises: 725813da484d
Create Date: 2021-09-06 11:31:50.349578

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "74e7f371be76"
down_revision = "725813da484d"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("UPDATE contributor_forms SET contribute_ways = '{}' WHERE contribute_ways IS NULL")
    op.alter_column("contributor_forms", "contribute_ways", nullable=False)


def downgrade():
    op.alter_column("contributor_forms", "contribute_ways", nullable=True)
