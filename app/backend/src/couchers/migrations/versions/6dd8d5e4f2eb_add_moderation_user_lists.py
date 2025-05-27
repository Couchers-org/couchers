"""Add moderation user lists

Revision ID: 6dd8d5e4f2eb
Revises: cd456767d2f7
Create Date: 2025-05-27 12:09:22.224139

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "6dd8d5e4f2eb"
down_revision = "cd456767d2f7"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "moderation_user_lists",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_moderation_user_lists")),
    )
    op.create_table(
        "moderation_user_list_members",
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("moderation_list_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(
            ["moderation_list_id"],
            ["moderation_user_lists.id"],
            name=op.f("fk_moderation_user_list_members_moderation_list_id_moderation_user_lists"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_moderation_user_list_members_user_id_users")),
        sa.PrimaryKeyConstraint("user_id", "moderation_list_id", name=op.f("pk_moderation_user_list_members")),
        sa.UniqueConstraint("user_id", "moderation_list_id", name=op.f("uq_moderation_user_list_members_user_id")),
    )


def downgrade():
    op.drop_table("moderation_user_list_members")
    op.drop_table("moderation_user_lists")
