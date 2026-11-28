"""Drop the user_ranking_offsets table

Revision ID: 0208
Revises: 0207
"""

import sqlalchemy as sa
from alembic import op

revision = "0208"
down_revision = "0207"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_table("user_ranking_offsets")


def downgrade() -> None:
    op.create_table(
        "user_ranking_offsets",
        sa.Column("variant", sa.String(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("offset", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_user_ranking_offsets_user_id_users")),
        sa.PrimaryKeyConstraint("variant", "user_id", name=op.f("pk_user_ranking_offsets")),
    )
