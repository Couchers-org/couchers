"""Remove name from SV

Revision ID: 49669627f688
Revises: 46e6b6a3d9ed
Create Date: 2024-06-10 19:29:43.420090

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "49669627f688"
down_revision = "46e6b6a3d9ed"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column("strong_verification_attempts", "passport_name")
    op.create_check_constraint(
        constraint_name="full_data_status",
        table_name="strong_verification_attempts",
        condition="(has_full_data IS TRUE AND passport_encrypted_data IS NOT NULL AND passport_date_of_birth IS NOT NULL) OR \
             (has_full_data IS FALSE AND passport_encrypted_data IS NULL AND passport_date_of_birth IS NULL)",
    )


def downgrade():
    raise Exception("Can't downgrade")
