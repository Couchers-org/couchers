"""switch-avatar_key-to-profile-gallery-id

Revision ID: ea01816d28ca
Revises: f8b4ef6e3819
Create Date: 2026-01-13 14:19:17.373895

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "ea01816d28ca"
down_revision = "f8b4ef6e3819"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Migrate existing avatar photos into galleries
    # For users who have an avatar_key, add it as the first photo in their gallery
    op.execute(
        """
        INSERT INTO photo_gallery_items (gallery_id, upload_key, position, caption)
        SELECT
            u.profile_gallery_id,
            u.avatar_key,
            0.0,  -- First position
            NULL  -- No caption initially
        FROM users u
        WHERE u.avatar_key IS NOT NULL
        ON CONFLICT (gallery_id, upload_key) DO NOTHING
        """
    )


def downgrade() -> None:
    # Remove photo_gallery_items that were migrated from avatar_key
    # Only delete items where the upload_key matches the user's avatar_key
    op.execute(
        """
        DELETE FROM photo_gallery_items pgi
        USING users u
        WHERE pgi.gallery_id = u.profile_gallery_id
          AND pgi.upload_key = u.avatar_key
        """
    )
