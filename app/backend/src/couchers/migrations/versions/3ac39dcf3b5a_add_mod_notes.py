"""Add mod notes

Revision ID: 3ac39dcf3b5a
Revises: 461446320dfa
Create Date: 2024-06-18 12:39:15.640199

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "3ac39dcf3b5a"
down_revision = "461446320dfa"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "mod_notes",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("acknowledged", sa.DateTime(timezone=True), nullable=True),
        sa.Column("internal_id", sa.String(), nullable=False),
        sa.Column("creator_user_id", sa.BigInteger(), nullable=False),
        sa.Column("note_content", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["creator_user_id"], ["users.id"], name=op.f("fk_mod_notes_creator_user_id_users")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_mod_notes_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_mod_notes")),
    )
    op.create_index(
        "ix_mod_notes_unacknowledged",
        "mod_notes",
        ["user_id"],
        unique=False,
        postgresql_where=sa.text("acknowledged IS NULL"),
    )
    op.create_index(op.f("ix_mod_notes_user_id"), "mod_notes", ["user_id"], unique=False)
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'modnote__create'")


def downgrade():
    raise Exception("Can't downgrade")
