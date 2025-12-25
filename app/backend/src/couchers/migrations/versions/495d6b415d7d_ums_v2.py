"""UMS v2

Revision ID: 495d6b415d7d
Revises: 53422855e410
Create Date: 2025-12-08 01:25:33.086297

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "495d6b415d7d"
down_revision = "53422855e410"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_index(op.f("ix_moderation_queue_item_author_user_id"), table_name="moderation_queue")
    op.drop_constraint(op.f("fk_moderation_queue_item_author_user_id_users"), "moderation_queue", type_="foreignkey")
    op.drop_column("moderation_queue", "item_author_user_id")


def downgrade() -> None:
    op.add_column(
        "moderation_queue", sa.Column("item_author_user_id", sa.BIGINT(), autoincrement=False, nullable=False)
    )
    op.create_foreign_key(
        op.f("fk_moderation_queue_item_author_user_id_users"),
        "moderation_queue",
        "users",
        ["item_author_user_id"],
        ["id"],
    )
    op.create_index(
        op.f("ix_moderation_queue_item_author_user_id"), "moderation_queue", ["item_author_user_id"], unique=False
    )
