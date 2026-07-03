"""Add priority to moderation queue items and flag references to the moderation log

Revision ID: 0168
Revises: 0167
Create Date: 2026-06-14 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0168"
down_revision = "0167"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "moderation_queue",
        sa.Column("priority", sa.Integer(), server_default="0", nullable=False),
    )
    op.add_column("moderation_log", sa.Column("new_priority", sa.Integer(), nullable=True))
    op.add_column("moderation_log", sa.Column("queue_item_id", sa.BigInteger(), nullable=True))
    op.create_index(op.f("ix_moderation_log_queue_item_id"), "moderation_log", ["queue_item_id"], unique=False)
    op.create_foreign_key(
        op.f("fk_moderation_log_queue_item_id_moderation_queue"),
        "moderation_log",
        "moderation_queue",
        ["queue_item_id"],
        ["id"],
    )

    op.execute("ALTER TYPE moderationaction ADD VALUE IF NOT EXISTS 'set_priority'")


def downgrade() -> None:
    op.drop_constraint(op.f("fk_moderation_log_queue_item_id_moderation_queue"), "moderation_log", type_="foreignkey")
    op.drop_index(op.f("ix_moderation_log_queue_item_id"), table_name="moderation_log")
    op.drop_column("moderation_log", "queue_item_id")
    op.drop_column("moderation_log", "new_priority")
    op.drop_column("moderation_queue", "priority")
