"""add_has_completed_profile_column

Revision ID: 7e65965e02d0
Revises: 6862ecf6494d
Create Date: 2025-12-31 18:10:56.460815

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "7e65965e02d0"
down_revision = "6862ecf6494d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add the has_completed_profile column with default False
    op.add_column("users", sa.Column("has_completed_profile", sa.Boolean(), server_default=sa.false(), nullable=False))

    # Backfill existing users based on whether they have photos and about_me >= 150 chars
    op.execute(
        """
        UPDATE users
        SET has_completed_profile = (
            (users.profile_gallery_id IS NOT NULL)
            AND EXISTS (
                SELECT 1
                FROM photo_gallery_items
                WHERE photo_gallery_items.gallery_id = users.profile_gallery_id
            )
            AND character_length(users.about_me) >= 150
        );
        """
    )

    # Update lite_users materialized view to use the new column
    # Drop and recreate the materialized view
    op.execute("DROP MATERIALIZED VIEW IF EXISTS lite_users;")
    op.execute(
        """
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
            users.has_completed_profile,
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


def downgrade() -> None:
    # Restore the old lite_users view that calculates has_completed_profile on the fly
    op.execute("DROP MATERIALIZED VIEW IF EXISTS lite_users;")
    op.execute(
        """
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
            ((users.profile_gallery_id IS NOT NULL) AND (EXISTS (SELECT 1
                FROM photo_gallery_items
                WHERE photo_gallery_items.gallery_id = users.profile_gallery_id)) AND (character_length(users.about_me) >= 150)) AS has_completed_profile,
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
    op.drop_column("users", "has_completed_profile")
