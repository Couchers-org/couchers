"""Add the used_signup_email_tokens table

Revision ID: 0209
Revises: 0208
"""

import sqlalchemy as sa
from alembic import op

revision = "0209"
down_revision = "0208"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "used_signup_email_tokens",
        sa.Column("token_hash", sa.LargeBinary(), nullable=False),
        sa.Column("expiry", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("token_hash", name=op.f("pk_used_signup_email_tokens")),
    )


def downgrade() -> None:
    op.drop_table("used_signup_email_tokens")
