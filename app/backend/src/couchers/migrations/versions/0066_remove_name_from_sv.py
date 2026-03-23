"""Remove name from SV

Revision ID: 0066
Revises: 0065
Create Date: 2024-06-10 19:29:43.420090

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0066"
down_revision = "0065"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("strong_verification_attempts", "passport_name")
    op.create_check_constraint(
        constraint_name="full_data_status",
        table_name="strong_verification_attempts",
        condition="(has_full_data IS TRUE AND passport_encrypted_data IS NOT NULL AND passport_date_of_birth IS NOT NULL) OR \
             (has_full_data IS FALSE AND passport_encrypted_data IS NULL AND passport_date_of_birth IS NULL)",
    )


def downgrade() -> None:
    raise Exception("Can't downgrade")
