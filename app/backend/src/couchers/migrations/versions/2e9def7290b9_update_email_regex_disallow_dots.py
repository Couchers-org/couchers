"""Update email regex to disallow dots before @ and consecutive dots

Revision ID: 2e9def7290b9
Revises: eeae61c8ee09
Create Date: 2026-02-16 04:23:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "2e9def7290b9"
down_revision = "eeae61c8ee09"
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
