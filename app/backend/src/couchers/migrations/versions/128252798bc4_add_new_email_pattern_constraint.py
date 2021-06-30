"""Add new email pattern constraint

Revision ID: 128252798bc4
Revises: 584f70c6a0d4
Create Date: 2021-05-27 14:42:39.834981

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "128252798bc4"
down_revision = "584f70c6a0d4"
branch_labels = None
depends_on = None


def upgrade():
    op.create_check_constraint(
        "valid_email",
        "users",
        "email ~ '^[0-9a-z][0-9a-z\-\_\+\.]*@([0-9a-z\-]+\.)*[0-9a-z\-]+\.[a-z]{2,}$'",
    )


def downgrade():
    raise Exception("Can't downgrade")
