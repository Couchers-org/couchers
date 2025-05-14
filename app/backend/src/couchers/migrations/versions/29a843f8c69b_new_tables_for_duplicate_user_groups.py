"""new tables for duplicate user groups

Revision ID: 29a843f8c69b
Revises: a0d344cfb455
Create Date: 2025-05-14 15:54:45.561654

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "29a843f8c69b"
down_revision = "a0d344cfb455"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "user_groups",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("group_type", sa.Enum("duplicate_account", name="usergrouptype"), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_user_groups")),
    )
    op.create_table(
        "user_group_members",
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("group_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(
            ["group_id"], ["user_groups.id"], name=op.f("fk_user_group_members_group_id_user_groups")
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_user_group_members_user_id_users")),
        sa.PrimaryKeyConstraint("user_id", "group_id", name=op.f("pk_user_group_members")),
    )


def downgrade():
    op.drop_table("user_group_members")
    op.drop_table("user_groups")
