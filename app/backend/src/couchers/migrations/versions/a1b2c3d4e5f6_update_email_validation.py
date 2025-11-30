"""Update email validation

Revision ID: a1b2c3d4e5f6
Revises: f7d5de383e11
Create Date: 2025-11-30 14:39:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "f7d5de383e11"
branch_labels = None
depends_on = None


def upgrade():
    # Drop the old constraint
    op.drop_constraint("valid_email", "users", type_="check")

    # Create new constraint with updated regex that disallows:
    # - dots immediately before @
    # - consecutive dots
    # The new pattern ensures dots can only appear followed by valid characters
    op.create_check_constraint(
        "valid_email",
        "users",
        r"email ~ '^[0-9a-z]([0-9a-z\-\_\+]|(\.[0-9a-z\-\_\+]))*@([0-9a-z\-]+\.)*[0-9a-z\-]+\.[a-z]{2,}$'",
    )


def downgrade():
    raise Exception("Can't downgrade")
