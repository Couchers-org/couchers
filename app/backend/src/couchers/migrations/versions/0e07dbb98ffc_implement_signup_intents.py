"""Implement signup intents

Revision ID: 0e07dbb98ffc
Revises: 2e9def7290b9
Create Date: 2026-02-16 22:51:33.008763

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0e07dbb98ffc"
down_revision = "2e9def7290b9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "signup_flows", sa.Column("filled_intents", sa.Boolean(), server_default=sa.text("false"), nullable=False)
    )
    op.add_column("signup_flows", sa.Column("heard_about_couchers", sa.String(), nullable=True))
    op.add_column(
        "signup_flows", sa.Column("signup_intents", sa.ARRAY(sa.String()), server_default="{}", nullable=False)
    )
    op.add_column("users", sa.Column("heard_about_couchers", sa.String(), nullable=True))
    op.add_column("users", sa.Column("signup_intents", sa.ARRAY(sa.String()), server_default="{}", nullable=False))


def downgrade() -> None:
    op.drop_column("users", "signup_intents")
    op.drop_column("users", "heard_about_couchers")
    op.drop_column("signup_flows", "signup_intents")
    op.drop_column("signup_flows", "heard_about_couchers")
    op.drop_column("signup_flows", "filled_intents")
