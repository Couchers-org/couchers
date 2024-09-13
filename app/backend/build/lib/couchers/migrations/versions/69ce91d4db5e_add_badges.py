"""Add badges

Revision ID: 69ce91d4db5e
Revises: ffe7d9a87925
Create Date: 2024-04-22 18:35:03.755659

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "69ce91d4db5e"
down_revision = "ffe7d9a87925"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "user_badges",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("badge_id", sa.String(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_user_badges_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_user_badges")),
        sa.UniqueConstraint("user_id", "badge_id", name=op.f("uq_user_badges_user_id")),
    )
    op.create_index(op.f("ix_user_badges_badge_id"), "user_badges", ["badge_id"], unique=False)
    op.create_index(op.f("ix_user_badges_user_id"), "user_badges", ["user_id"], unique=False)
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'badge__add'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'badge__remove'")


def downgrade():
    raise Exception("Can't downgrade")
