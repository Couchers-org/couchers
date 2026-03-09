"""Add new email pattern constraint

Revision ID: 0011
Revises: 0010
Create Date: 2021-05-27 14:42:39.834981

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0011"
down_revision = "0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_check_constraint(
        "valid_email",
        "users",
        r"email ~ '^[0-9a-z][0-9a-z\-\_\+\.]*@([0-9a-z\-]+\.)*[0-9a-z\-]+\.[a-z]{2,}$'",
    )


def downgrade() -> None:
    raise Exception("Can't downgrade")
