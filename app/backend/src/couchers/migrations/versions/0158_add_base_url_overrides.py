"""Add base url overrides

Revision ID: 0158
Revises: 0157
Create Date: 2026-05-24 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0158"
down_revision = "0157"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "base_url_overrides",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("base_url", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_base_url_overrides_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_base_url_overrides")),
    )
    op.create_index(op.f("ix_base_url_overrides_user_id"), "base_url_overrides", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_base_url_overrides_user_id"), table_name="base_url_overrides")
    op.drop_table("base_url_overrides")
