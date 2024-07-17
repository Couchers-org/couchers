"""Add donation status

Revision ID: bc7b6ebf50ea
Revises: 461446320dfa
Create Date: 2024-07-17 09:46:20.672556

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "bc7b6ebf50ea"
down_revision = "461446320dfa"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "phone_verification_callback_events",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("verification_attempt_token", sa.String(), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "succeeded",
                "in_progress_waiting_on_user_to_open_app",
                "in_progress_waiting_on_user_in_app",
                "in_progress_waiting_on_backend",
                "failed",
                "deleted",
                name="strongverificationattemptstatus",
            ),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_phone_verification_callback_events")),
        sa.UniqueConstraint(
            "verification_attempt_token", name=op.f("uq_phone_verification_callback_events_verification_attempt_token")
        ),
    )
    op.add_column("users", sa.Column("has_donated", sa.Boolean(), server_default=sa.text("false"), nullable=False))


def downgrade():
    op.drop_column("users", "has_donated")
    op.drop_table("phone_verification_callback_events")
