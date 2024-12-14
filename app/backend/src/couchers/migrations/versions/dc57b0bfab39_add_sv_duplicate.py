"""Add SV duplicate

Revision ID: dc57b0bfab39
Revises: 2fc64cf68321
Create Date: 2024-12-13 20:45:39.172527

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "dc57b0bfab39"
down_revision = "2fc64cf68321"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'verification__sv_fail'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'verification__sv_success'")
    op.execute("ALTER TYPE strongverificationattemptstatus ADD VALUE 'duplicate'")
    op.drop_constraint(
        op.f("ck_strong_verification_attempts_deleted_implies_minimal_data"), "strong_verification_attempts"
    )
    # enum values have to be committed before they can be used
    op.execute("COMMIT")
    op.create_check_constraint(
        "deleted_duplicate_implies_minimal_data",
        "strong_verification_attempts",
        "(NOT ((status = 'deleted') OR (status = 'duplicate'))) OR (has_minimal_data IS TRUE)",
    )


def downgrade():
    raise Exception("Can't downgrade")
