"""Backend/moderation: UMS coverage for discussions

Revision ID: 0150
Revises: 0149
Create Date: 2026-05-10 01:23:40.985349

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0150"
down_revision = "0149"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("discussions", sa.Column("moderation_state_id", sa.BigInteger(), nullable=False))
    op.create_index(op.f("ix_discussions_moderation_state_id"), "discussions", ["moderation_state_id"], unique=False)
    op.create_foreign_key(
        op.f("fk_discussions_moderation_state_id_moderation_states"),
        "discussions",
        "moderation_states",
        ["moderation_state_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(op.f("fk_discussions_moderation_state_id_moderation_states"), "discussions", type_="foreignkey")
    op.drop_index(op.f("ix_discussions_moderation_state_id"), table_name="discussions")
    op.drop_column("discussions", "moderation_state_id")
