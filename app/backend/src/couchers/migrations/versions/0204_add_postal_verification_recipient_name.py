"""Add recipient name to postal verification attempts

Revision ID: 0204
Revises: 0203
"""

import sqlalchemy as sa
from alembic import op

revision = "0204"
down_revision = "0203"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("postal_verification_attempts", sa.Column("recipient_name", sa.String(), nullable=True))
    # Postcards used to be addressed to the profile name at send time; the current name is the best we have
    op.execute(
        """
        UPDATE postal_verification_attempts
        SET recipient_name = users.name
        FROM users
        WHERE users.id = postal_verification_attempts.user_id
        """
    )
    op.alter_column("postal_verification_attempts", "recipient_name", nullable=False)


def downgrade() -> None:
    op.drop_column("postal_verification_attempts", "recipient_name")
