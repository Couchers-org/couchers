"""backfill_missing_profile_galleries

This migration creates profile galleries for any users who don't have one.
This can happen if a user was created between the initial gallery migration
and the signup code update that creates galleries automatically.

Revision ID: 6862ecf6494d
Revises: f8b4ef6e3819
Create Date: 2025-12-26 18:34:10.385471

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "6862ecf6494d"
down_revision = "f8b4ef6e3819"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create profile galleries for users who don't have one
    # Uses a CTE to insert galleries and update users in one operation
    op.execute(
        """
        WITH new_galleries AS (
            INSERT INTO photo_galleries (owner_user_id)
            SELECT id
            FROM users
            WHERE profile_gallery_id IS NULL
            RETURNING id, owner_user_id
        )
        UPDATE users
        SET profile_gallery_id = new_galleries.id
        FROM new_galleries
        WHERE users.id = new_galleries.owner_user_id
        """
    )

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
        AND u.profile_gallery_id IS NOT NULL
        AND NOT EXISTS (
            -- Don't add if it's already in the gallery
            SELECT 1
            FROM photo_gallery_items pgi
            WHERE pgi.gallery_id = u.profile_gallery_id
            AND pgi.upload_key = u.avatar_key
        )
        """
    )


def downgrade() -> None:
    # Remove migrated avatar photos from galleries
    # Only remove items where the upload_key matches the user's avatar_key
    # and it's at position 0.0 (first position)
    op.execute(
        """
        DELETE FROM photo_gallery_items
        WHERE id IN (
            SELECT pgi.id
            FROM photo_gallery_items pgi
            JOIN users u ON u.profile_gallery_id = pgi.gallery_id
            WHERE pgi.upload_key = u.avatar_key
            AND pgi.position = 0.0
        )
        """
    )

    # Remove profile galleries that were created by this migration
    # and set profile_gallery_id back to NULL for those users
    op.execute(
        """
        WITH galleries_to_delete AS (
            SELECT pg.id, pg.owner_user_id
            FROM photo_galleries pg
            LEFT JOIN photo_gallery_items pgi ON pg.id = pgi.gallery_id
            WHERE pgi.id IS NULL  -- Only delete empty galleries
            AND pg.id IN (
                SELECT profile_gallery_id
                FROM users
                WHERE profile_gallery_id IS NOT NULL
            )
        )
        UPDATE users
        SET profile_gallery_id = NULL
        FROM galleries_to_delete
        WHERE users.id = galleries_to_delete.owner_user_id
        """
    )

    # Delete the empty galleries
    op.execute(
        """
        DELETE FROM photo_galleries
        WHERE id IN (
            SELECT pg.id
            FROM photo_galleries pg
            LEFT JOIN photo_gallery_items pgi ON pg.id = pgi.gallery_id
            WHERE pgi.id IS NULL  -- Only delete empty galleries
            AND pg.id NOT IN (
                SELECT profile_gallery_id
                FROM users
                WHERE profile_gallery_id IS NOT NULL
            )
        )
        """
    )
