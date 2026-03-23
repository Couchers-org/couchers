"""Add phone verification constraints

Revision ID: 0015
Revises: 0014
Create Date: 2021-06-14 09:10:35.309227

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0015"
down_revision = "0014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_check_constraint(
        "phone_verified_conditions",
        "users",
        "((((((phone IS NULL))::integer + ((phone_verification_verified IS NOT NULL))::integer) + ((phone_verification_token IS NOT NULL))::integer) = 1))",
    )


def downgrade() -> None:
    raise Exception("hell")
