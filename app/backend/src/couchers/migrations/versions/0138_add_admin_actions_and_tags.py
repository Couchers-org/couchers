"""Add admin_actions and tags tables

Revision ID: 0138
Revises: 0137
Create Date: 2026-02-21 12:00:00.000000

"""

import re

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0138"
down_revision = "0137"
branch_labels = None
depends_on = None

# Regex to parse existing admin_note entries:
# [2024-05-18T17:35:27.362898+00:00] (id: 123, username: admin) Some note text
ADMIN_NOTE_RE = re.compile(r"\[([^\]]+)\] \(id: (\d+), username: ([^)]+)\) (.*?)(?=\n\[|\n*$)", re.DOTALL)


def upgrade():
    op.create_table(
        "admin_actions",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("admin_user_id", sa.BigInteger(), nullable=False),
        sa.Column("target_user_id", sa.BigInteger(), nullable=False),
        sa.Column("action_type", sa.String(), nullable=False),
        sa.Column(
            "level",
            sa.Enum("debug", "normal", "high", name="adminactionlevel"),
            server_default="normal",
            nullable=False,
        ),
        sa.Column("note", sa.String(), nullable=True),
        sa.Column("tag", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["admin_user_id"], ["users.id"], name=op.f("fk_admin_actions_admin_user_id_users")),
        sa.ForeignKeyConstraint(["target_user_id"], ["users.id"], name=op.f("fk_admin_actions_target_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_admin_actions")),
    )
    op.create_index(op.f("ix_admin_actions_admin_user_id"), "admin_actions", ["admin_user_id"])
    op.create_index(op.f("ix_admin_actions_target_user_id"), "admin_actions", ["target_user_id"])
    op.create_index("ix_admin_actions_target_created", "admin_actions", ["target_user_id", "created"])

    op.create_table(
        "admin_tags",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("tag", sa.String(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_admin_tags")),
        sa.UniqueConstraint("tag", name=op.f("uq_admin_tags_tag")),
    )

    op.create_table(
        "user_admin_tags",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("admin_tag_id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_user_admin_tags_user_id_users")),
        sa.ForeignKeyConstraint(
            ["admin_tag_id"], ["admin_tags.id"], name=op.f("fk_user_admin_tags_admin_tag_id_admin_tags")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_user_admin_tags")),
        sa.UniqueConstraint("user_id", "admin_tag_id", name=op.f("uq_user_admin_tags_user_id")),
    )
    op.create_index(op.f("ix_user_admin_tags_user_id"), "user_admin_tags", ["user_id"])
    op.create_index(op.f("ix_user_admin_tags_admin_tag_id"), "user_admin_tags", ["admin_tag_id"])

    # Migrate existing admin_note data into admin_actions
    conn = op.get_bind()
    users_with_notes = conn.execute(
        sa.text("SELECT id, admin_note FROM users WHERE admin_note != '' AND admin_note IS NOT NULL")
    )
    for user_id, admin_note in users_with_notes:
        for match in ADMIN_NOTE_RE.finditer(admin_note):
            timestamp_str, admin_id, _admin_username, note_text = match.groups()
            note_text = note_text.strip()
            if not note_text:
                continue
            conn.execute(
                sa.text(
                    "INSERT INTO admin_actions (created, admin_user_id, target_user_id, action_type, level, note) "
                    "VALUES (:created, :admin_user_id, :target_user_id, 'note', 'normal', :note)"
                ),
                {
                    "created": timestamp_str,
                    "admin_user_id": int(admin_id),
                    "target_user_id": user_id,
                    "note": note_text,
                },
            )

    # Do NOT drop admin_note column (keep for rollback safety)


def downgrade():
    op.drop_table("user_admin_tags")
    op.drop_table("admin_tags")
    op.drop_table("admin_actions")
    sa.Enum(name="adminactionlevel").drop(op.get_bind())
