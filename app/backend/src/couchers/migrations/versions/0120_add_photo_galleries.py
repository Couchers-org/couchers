"""Add photo galleries

Revision ID: 0120
Revises: 0119
Create Date: 2025-11-11 21:06:43.956842

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0120"
down_revision = "0119"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "photo_galleries",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("owner_user_id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], name=op.f("fk_photo_galleries_owner_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_photo_galleries")),
    )
    op.create_index(op.f("ix_photo_galleries_owner_user_id"), "photo_galleries", ["owner_user_id"], unique=False)
    op.create_table(
        "photo_gallery_items",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("gallery_id", sa.BigInteger(), nullable=False),
        sa.Column("upload_key", sa.String(), nullable=False),
        sa.Column("position", sa.Float(), nullable=False),
        sa.Column("caption", sa.String(), nullable=True),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["gallery_id"], ["photo_galleries.id"], name=op.f("fk_photo_gallery_items_gallery_id_photo_galleries")
        ),
        sa.ForeignKeyConstraint(
            ["upload_key"], ["uploads.key"], name=op.f("fk_photo_gallery_items_upload_key_uploads")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_photo_gallery_items")),
        sa.UniqueConstraint("gallery_id", "upload_key", name="uix_gallery_upload"),
    )
    op.create_index(op.f("ix_photo_gallery_items_gallery_id"), "photo_gallery_items", ["gallery_id"], unique=False)

    # Add profile_gallery_id column to users (nullable)
    op.add_column("users", sa.Column("profile_gallery_id", sa.BigInteger(), nullable=True))

    # Create a profile gallery for each existing user and update users.profile_gallery_id
    op.execute(
        """
        WITH new_galleries AS (
            INSERT INTO photo_galleries (owner_user_id)
            SELECT id FROM users
            RETURNING id, owner_user_id
        )
        UPDATE users
        SET profile_gallery_id = new_galleries.id
        FROM new_galleries
        WHERE users.id = new_galleries.owner_user_id
        """
    )

    # Add FK constraint (profile_gallery_id stays nullable)
    op.create_foreign_key(
        op.f("fk_users_profile_gallery_id_photo_galleries"), "users", "photo_galleries", ["profile_gallery_id"], ["id"]
    )


def downgrade() -> None:
    op.drop_constraint(op.f("fk_users_profile_gallery_id_photo_galleries"), "users", type_="foreignkey")
    op.drop_column("users", "profile_gallery_id")
    op.drop_index(op.f("ix_photo_gallery_items_gallery_id"), table_name="photo_gallery_items")
    op.drop_table("photo_gallery_items")
    op.drop_index(op.f("ix_photo_galleries_owner_user_id"), table_name="photo_galleries")
    op.drop_table("photo_galleries")
