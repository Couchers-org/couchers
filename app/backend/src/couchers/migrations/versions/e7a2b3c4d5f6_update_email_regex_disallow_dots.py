"""Update email regex to disallow dots before @ and consecutive dots

Revision ID: e7a2b3c4d5f6
Revises: f016e6defa9d
Create Date: 2026-02-16 04:23:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "e7a2b3c4d5f6"
down_revision = "f016e6defa9d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("valid_email", "users")
    op.create_check_constraint(
        "valid_email",
        "users",
        r"email ~ '^[0-9a-z]([0-9a-z\-\_\+]|(\.[0-9a-z\-\_\+]))*@([0-9a-z\-]+\.)*[0-9a-z\-]+\.[a-z]{2,}$'",
    )


def downgrade() -> None:
    raise Exception("Can't downgrade")
