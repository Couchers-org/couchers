"""Switch to new stripe account

Revision ID: 0033
Revises: 0032
Create Date: 2022-01-14 14:33:58.465424

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0033"
down_revision = "0032"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE users RENAME COLUMN stripe_customer_id TO stripe_customer_id_old")
    op.add_column("users", sa.Column("stripe_customer_id", sa.String(), nullable=True))


def downgrade() -> None:
    raise Exception("Can't downgrade")
