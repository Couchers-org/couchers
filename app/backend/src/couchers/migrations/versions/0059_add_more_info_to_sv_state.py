"""Add more info to SV state

Revision ID: 0059
Revises: 0058
Create Date: 2024-05-25 09:42:43.005852

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0059"
down_revision = "0058"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TYPE strongverificationattemptstatus RENAME VALUE 'in_progress_waiting_on_user' TO 'in_progress_waiting_on_user_to_open_app'"
    )
    op.execute("ALTER TYPE strongverificationattemptstatus ADD VALUE 'in_progress_waiting_on_user_in_app'")
    op.drop_constraint(
        op.f("ck_strong_verification_attempts_in_progress_failed_iris_implies_no_data"), "strong_verification_attempts"
    )
    # enum values have to be committed before they can be used
    op.execute("COMMIT")
    op.create_check_constraint(
        "in_progress_failed_iris_implies_no_data",
        "strong_verification_attempts",
        "(NOT ((status = 'in_progress_waiting_on_user_to_open_app') OR (status = 'in_progress_waiting_on_user_in_app') OR (status = 'in_progress_waiting_on_backend') OR (status = 'failed'))) OR (has_minimal_data IS FALSE)",
    )


def downgrade() -> None:
    raise Exception("Can't downgrade")
