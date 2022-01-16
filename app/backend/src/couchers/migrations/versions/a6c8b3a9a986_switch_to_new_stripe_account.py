"""Switch to new stripe account

Revision ID: a6c8b3a9a986
Revises: 6aa87f3539f9
Create Date: 2022-01-14 14:33:58.465424

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a6c8b3a9a986"
down_revision = "6aa87f3539f9"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE users RENAME COLUMN stripe_customer_id TO stripe_customer_id_old")
    op.add_column("users", sa.Column("stripe_customer_id", sa.String(), nullable=True))


def downgrade():
    raise Exception("Can't downgrade")
