"""Add edit/delete support to discussions, comments, and replies

Revision ID: 0158
Revises: 0157
Create Date: 2026-05-13 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0158"
down_revision = "0157"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "discussions",
        sa.Column("deleted", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "discussions",
        sa.Column("last_edited", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "comments",
        sa.Column("last_edited", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "replies",
        sa.Column("last_edited", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "discussion_versions",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("discussion_id", sa.BigInteger(), nullable=False),
        sa.Column("editor_user_id", sa.BigInteger(), nullable=False),
        sa.Column("change_type", sa.Enum("edit", "delete", name="contentchangetype"), nullable=False),
        sa.Column("old_title", sa.String(), nullable=True),
        sa.Column("new_title", sa.String(), nullable=True),
        sa.Column("old_content", sa.String(), nullable=True),
        sa.Column("new_content", sa.String(), nullable=True),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["discussion_id"], ["discussions.id"]),
        sa.ForeignKeyConstraint(["editor_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_discussion_versions_discussion_id", "discussion_versions", ["discussion_id"])
    op.create_index("ix_discussion_versions_editor_user_id", "discussion_versions", ["editor_user_id"])

    op.create_table(
        "comment_versions",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("comment_id", sa.BigInteger(), nullable=False),
        sa.Column("editor_user_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "change_type", sa.Enum("edit", "delete", name="contentchangetype", create_type=False), nullable=False
        ),
        sa.Column("old_content", sa.String(), nullable=True),
        sa.Column("new_content", sa.String(), nullable=True),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["comment_id"], ["comments.id"]),
        sa.ForeignKeyConstraint(["editor_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_comment_versions_comment_id", "comment_versions", ["comment_id"])
    op.create_index("ix_comment_versions_editor_user_id", "comment_versions", ["editor_user_id"])

    op.create_table(
        "reply_versions",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("reply_id", sa.BigInteger(), nullable=False),
        sa.Column("editor_user_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "change_type", sa.Enum("edit", "delete", name="contentchangetype", create_type=False), nullable=False
        ),
        sa.Column("old_content", sa.String(), nullable=True),
        sa.Column("new_content", sa.String(), nullable=True),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["reply_id"], ["replies.id"]),
        sa.ForeignKeyConstraint(["editor_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_reply_versions_reply_id", "reply_versions", ["reply_id"])
    op.create_index("ix_reply_versions_editor_user_id", "reply_versions", ["editor_user_id"])


def downgrade() -> None:
    op.drop_table("reply_versions")
    op.drop_table("comment_versions")
    op.drop_table("discussion_versions")
    sa.Enum(name="contentchangetype").drop(op.get_bind(), checkfirst=True)

    op.drop_column("replies", "last_edited")
    op.drop_column("comments", "last_edited")
    op.drop_column("discussions", "last_edited")
    op.drop_column("discussions", "deleted")
