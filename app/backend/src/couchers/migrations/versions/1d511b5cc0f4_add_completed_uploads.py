"""Add completed uploads

Revision ID: 1d511b5cc0f4
Revises: c4445e08ea86
Create Date: 2021-02-22 15:51:02.954652

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "1d511b5cc0f4"
down_revision = "c4445e08ea86"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "uploads",
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("creator_user_id", sa.BigInteger(), nullable=False),
        sa.Column("credit", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["creator_user_id"], ["users.id"], name=op.f("fk_uploads_creator_user_id_users")),
        sa.PrimaryKeyConstraint("filename", name=op.f("pk_uploads")),
    )
    op.create_index(op.f("ix_uploads_creator_user_id"), "uploads", ["creator_user_id"], unique=False)
    op.alter_column("initiated_uploads", "user_id", new_column_name="initiator_user_id")
    op.create_foreign_key(
        op.f("fk_users_avatar_filename_uploads"), "users", "uploads", ["avatar_filename"], ["filename"]
    )


def downgrade():
    op.drop_constraint(op.f("fk_users_avatar_filename_uploads"), "users", type_="foreignkey")
    op.alter_column("initiated_uploads", "initiator_user_id", new_column_name="user_id")
    op.drop_table("uploads")
