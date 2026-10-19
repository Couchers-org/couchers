"""Add user_ranking_offsets table

Revision ID: 0197
Revises: 0196
Create Date: 2026-10-18 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0197"
down_revision = "0196"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_ranking_offsets",
        sa.Column("variant", sa.String(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("offset", sa.Float(), nullable=False),
        sa.Column("updated", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_user_ranking_offsets_user_id_users")),
        sa.PrimaryKeyConstraint("variant", "user_id", name=op.f("pk_user_ranking_offsets")),
    )


def downgrade() -> None:
    op.drop_table("user_ranking_offsets")
