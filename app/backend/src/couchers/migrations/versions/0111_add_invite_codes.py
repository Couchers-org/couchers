"""add invite codes

Revision ID: 0111
Revises: 0110
Create Date: 2025-07-21 16:09:53.901168

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0111"
down_revision = "0110"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "invite_codes",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("created", sa.DateTime(timezone=True), nullable=False),
        sa.Column("disabled", sa.DateTime(timezone=True), nullable=True),
        sa.Column("creator_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
    )

    op.add_column("users", sa.Column("invite_code_id", sa.String(), sa.ForeignKey("invite_codes.id"), nullable=True))
    op.add_column(
        "signup_flows",
        sa.Column("invite_code_id", sa.String(), sa.ForeignKey("invite_codes.id"), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("signup_flows", "invite_code_id")
    op.drop_column("users", "invite_code_id")
    op.drop_table("invite_codes")
