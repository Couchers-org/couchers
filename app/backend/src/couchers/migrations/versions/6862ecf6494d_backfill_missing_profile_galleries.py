"""backfill_missing_profile_galleries

This migration completes the transition from avatar_key to profile_gallery system:
1. Migrates existing avatar_key photos into the galleries
2. Updates lite_users materialized view to use profile galleries (computing has_completed_profile)
3. Removes the avatar_key column from users table

Revision ID: 6862ecf6494d
Revises: a1b2c3d4e5f6
Create Date: 2025-12-26 18:34:10.385471

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "6862ecf6494d"
down_revision = "a1b2c3d4e5f6"
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

    # Update lite_users materialized view to use profile galleries
    # has_completed_profile is now computed: user has at least one photo and about_me >= 150 chars
    op.execute(
        """
        DROP MATERIALIZED VIEW lite_users;
        CREATE MATERIALIZED VIEW lite_users AS
        SELECT
            users.id,
            users.username,
            users.name,
            users.city,
            date_part('year', age(users.birthdate)) AS age,
            users.geom,
            users.geom_radius AS radius,
            (NOT (users.is_banned OR users.is_deleted)) AS is_visible,
            uploads.filename AS avatar_filename,
            ((users.profile_gallery_id IS NOT NULL)
                AND EXISTS (SELECT 1 AS anon_1 FROM photo_gallery_items WHERE photo_gallery_items.gallery_id = users.profile_gallery_id)
                AND COALESCE(character_length(users.about_me), 0) >= 150) AS has_completed_profile,
            ((users.max_guests IS NOT NULL) AND (users.sleeping_arrangement IS NOT NULL) AND ((users.about_place IS NOT NULL) OR (users.other_host_info IS NOT NULL) OR (users.sleeping_details IS NOT NULL) OR (users.area IS NOT NULL) OR (users.house_rules IS NOT NULL))) AS has_completed_my_home,
            COALESCE(sv_subquery."true", false) AS has_strong_verification
        FROM users
        LEFT OUTER JOIN (
            SELECT DISTINCT ON (photo_gallery_items.gallery_id)
                photo_gallery_items.gallery_id,
                photo_gallery_items.upload_key
            FROM photo_gallery_items
            ORDER BY photo_gallery_items.gallery_id, photo_gallery_items.position
        ) first_photo ON first_photo.gallery_id = users.profile_gallery_id
        LEFT OUTER JOIN uploads ON uploads.key = first_photo.upload_key
        LEFT OUTER JOIN
            (SELECT DISTINCT
                users_1.id,
                true AS "true"
            FROM strong_verification_attempts, users users_1
            WHERE
                ((strong_verification_attempts.status = 'succeeded')
                AND COALESCE(timezone('Etc/UTC', strong_verification_attempts.passport_expiry_date::timestamp without time zone) >= now(), false)
                AND strong_verification_attempts.passport_date_of_birth = users_1.birthdate
                AND (
                    (users_1.gender = 'Woman' AND strong_verification_attempts.passport_sex = 'female')
                    OR (users_1.gender = 'Man' AND strong_verification_attempts.passport_sex = 'male')
                    OR strong_verification_attempts.passport_sex = 'unspecified'
                    OR users_1.has_passport_sex_gender_exception = true
                ))
            ) sv_subquery
        ON sv_subquery.id = users.id;

        CREATE INDEX idx_lite_users_geom ON lite_users USING gist (geom);
        CREATE UNIQUE INDEX uq_lite_users_id ON lite_users(id);
        CREATE UNIQUE INDEX uq_lite_users_username ON lite_users(username);
        CREATE INDEX ix_lite_users_id_visible ON lite_users USING hash (id) WHERE is_visible;
        CREATE INDEX ix_lite_users_username_visible ON lite_users USING hash (username) WHERE is_visible;
        """
    )

    # Drop the avatar_key column and its foreign key constraint
    # Avatar is now always the first photo in the profile gallery
    op.drop_constraint("fk_users_avatar_key_uploads", "users", type_="foreignkey")
    op.drop_column("users", "avatar_key")


def downgrade() -> None:
    # Re-add the avatar_key column
    op.add_column("users", sa.Column("avatar_key", sa.String(), nullable=True))
    op.create_foreign_key("fk_users_avatar_key_uploads", "users", "uploads", ["avatar_key"], ["key"])

    # Restore avatar_key from the first photo in each user's gallery
    op.execute(
        """
        UPDATE users
        SET avatar_key = first_photo.upload_key
        FROM (
            SELECT DISTINCT ON (photo_gallery_items.gallery_id)
                photo_gallery_items.gallery_id,
                photo_gallery_items.upload_key
            FROM photo_gallery_items
            ORDER BY photo_gallery_items.gallery_id, photo_gallery_items.position
        ) first_photo
        WHERE first_photo.gallery_id = users.profile_gallery_id
        """
    )

    # Restore the old lite_users view that uses avatar_key
    op.execute(
        """
        DROP MATERIALIZED VIEW lite_users;
        CREATE MATERIALIZED VIEW lite_users AS
        SELECT
            users.id,
            users.username,
            users.name,
            users.city,
            date_part('year', age(users.birthdate)) AS age,
            users.geom,
            users.geom_radius AS radius,
            (NOT (users.is_banned OR users.is_deleted)) AS is_visible,
            uploads.filename AS avatar_filename,
            ((users.avatar_key IS NOT NULL) AND (character_length(users.about_me) >= 150)) AS has_completed_profile,
            ((users.max_guests IS NOT NULL) AND (users.sleeping_arrangement IS NOT NULL) AND ((users.about_place IS NOT NULL) OR (users.other_host_info IS NOT NULL) OR (users.sleeping_details IS NOT NULL) OR (users.area IS NOT NULL) OR (users.house_rules IS NOT NULL))) AS has_completed_my_home,
            COALESCE(sv_subquery."true", false) AS has_strong_verification
        FROM users
        LEFT OUTER JOIN uploads ON uploads.key = users.avatar_key
        LEFT OUTER JOIN
            (SELECT DISTINCT
                users_1.id,
                true AS "true"
            FROM strong_verification_attempts, users users_1
            WHERE
                ((strong_verification_attempts.status = 'succeeded')
                AND COALESCE(timezone('Etc/UTC', strong_verification_attempts.passport_expiry_date::timestamp without time zone) >= now(), false)
                AND strong_verification_attempts.passport_date_of_birth = users_1.birthdate
                AND (
                    (users_1.gender = 'Woman' AND strong_verification_attempts.passport_sex = 'female')
                    OR (users_1.gender = 'Man' AND strong_verification_attempts.passport_sex = 'male')
                    OR strong_verification_attempts.passport_sex = 'unspecified'
                    OR users_1.has_passport_sex_gender_exception = true
                ))
            ) sv_subquery
        ON sv_subquery.id = users.id;

        CREATE INDEX idx_lite_users_geom ON lite_users USING gist (geom);
        CREATE UNIQUE INDEX uq_lite_users_id ON lite_users(id);
        CREATE UNIQUE INDEX uq_lite_users_username ON lite_users(username);
        CREATE INDEX ix_lite_users_id_visible ON lite_users USING hash (id) WHERE is_visible;
        CREATE INDEX ix_lite_users_username_visible ON lite_users USING hash (username) WHERE is_visible;
        """
    )

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
