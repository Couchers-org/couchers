"""Backend/moderation: UMS coverage for thread comments and replies

Revision ID: 0149
Revises: 0148
Create Date: 2026-05-10 00:57:29.125757

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0149"
down_revision = "0148"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("comments", sa.Column("moderation_state_id", sa.BigInteger(), nullable=False))
    op.create_index(op.f("ix_comments_moderation_state_id"), "comments", ["moderation_state_id"], unique=False)
    op.create_foreign_key(
        op.f("fk_comments_moderation_state_id_moderation_states"),
        "comments",
        "moderation_states",
        ["moderation_state_id"],
        ["id"],
    )
    op.add_column("replies", sa.Column("moderation_state_id", sa.BigInteger(), nullable=False))
    op.create_index(op.f("ix_replies_moderation_state_id"), "replies", ["moderation_state_id"], unique=False)
    op.create_foreign_key(
        op.f("fk_replies_moderation_state_id_moderation_states"),
        "replies",
        "moderation_states",
        ["moderation_state_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(op.f("fk_replies_moderation_state_id_moderation_states"), "replies", type_="foreignkey")
    op.drop_index(op.f("ix_replies_moderation_state_id"), table_name="replies")
    op.drop_column("replies", "moderation_state_id")
    op.drop_constraint(op.f("fk_comments_moderation_state_id_moderation_states"), "comments", type_="foreignkey")
    op.drop_index(op.f("ix_comments_moderation_state_id"), table_name="comments")
    op.drop_column("comments", "moderation_state_id")
