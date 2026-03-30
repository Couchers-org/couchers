"""Add indexes for completed profile and moderation state queries, add precomputed geojson to lite_users

Revision ID: 0141
Revises: 0140
Create Date: 2026-03-29 22:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0141"
down_revision = "0140"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE INDEX ix_users_completed_profile ON users (id)
        WHERE banned_at IS NULL
          AND deleted_at IS NULL
          AND profile_gallery_id IS NOT NULL
          AND COALESCE(character_length((about_me)::text), 0) >= 150;
    """)
    op.create_index(
        "ix_moderation_states_type_visibility",
        "moderation_states",
        ["object_type", "visibility"],
    )

    # Recreate lite_users with precomputed geojson column
    op.execute("DROP MATERIALIZED VIEW IF EXISTS lite_users")
    op.execute("""
        CREATE MATERIALIZED VIEW lite_users AS
        SELECT
            users.id,
            users.username,
            users.name,
            users.city,
            date_part('year', age(users.birthdate)) AS age,
            users.geom,
            users.geom_radius AS radius,
            (users.banned_at IS NULL AND users.deleted_at IS NULL) AS is_visible,
            uploads.filename AS avatar_filename,
            ((users.profile_gallery_id IS NOT NULL)
                AND EXISTS (SELECT 1 AS anon_1 FROM photo_gallery_items WHERE photo_gallery_items.gallery_id = users.profile_gallery_id)
                AND COALESCE(character_length(users.about_me), 0) >= 150) AS has_completed_profile,
            ((users.max_guests IS NOT NULL) AND (users.sleeping_arrangement IS NOT NULL) AND ((users.about_place IS NOT NULL) OR (users.other_host_info IS NOT NULL) OR (users.sleeping_details IS NOT NULL) OR (users.area IS NOT NULL) OR (users.house_rules IS NOT NULL))) AS has_completed_my_home,
            COALESCE(sv_subquery."true", false) AS has_strong_verification,
            CAST(json_build_object(
                'type', 'Feature',
                'geometry', CAST(ST_AsGeoJSON(users.geom, 5) AS json),
                'properties', json_build_object('id', users.id, 'has_completed_profile',
                    ((users.profile_gallery_id IS NOT NULL)
                        AND EXISTS (SELECT 1 AS anon_2 FROM photo_gallery_items WHERE photo_gallery_items.gallery_id = users.profile_gallery_id)
                        AND COALESCE(character_length(users.about_me), 0) >= 150))
            ) AS text) AS geojson
        FROM users
        LEFT OUTER JOIN (
            SELECT DISTINCT ON (photo_gallery_items.gallery_id)
                photo_gallery_items.gallery_id,
                photo_gallery_items.upload_key
            FROM photo_gallery_items
            ORDER BY photo_gallery_items.gallery_id, photo_gallery_items.position
        ) avatar_photo ON avatar_photo.gallery_id = users.profile_gallery_id
        LEFT OUTER JOIN uploads ON uploads.key = avatar_photo.upload_key
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
        ON sv_subquery.id = users.id
    """)
    op.execute("CREATE UNIQUE INDEX uq_lite_users_id ON lite_users(id)")
    op.execute("CREATE UNIQUE INDEX uq_lite_users_username ON lite_users(username)")
    op.execute("CREATE INDEX ix_lite_users_id_visible ON lite_users USING hash (id) WHERE is_visible")
    op.execute("CREATE INDEX ix_lite_users_username_visible ON lite_users USING hash (username) WHERE is_visible")
    op.execute("CREATE INDEX idx_lite_users_geom ON lite_users USING gist (geom)")


def downgrade() -> None:
    # Recreate lite_users without geojson column
    op.execute("DROP MATERIALIZED VIEW IF EXISTS lite_users")
    op.execute("""
        CREATE MATERIALIZED VIEW lite_users AS
        SELECT
            users.id,
            users.username,
            users.name,
            users.city,
            date_part('year', age(users.birthdate)) AS age,
            users.geom,
            users.geom_radius AS radius,
            (users.banned_at IS NULL AND users.deleted_at IS NULL) AS is_visible,
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
        ) avatar_photo ON avatar_photo.gallery_id = users.profile_gallery_id
        LEFT OUTER JOIN uploads ON uploads.key = avatar_photo.upload_key
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
        ON sv_subquery.id = users.id
    """)
    op.execute("CREATE UNIQUE INDEX uq_lite_users_id ON lite_users(id)")
    op.execute("CREATE UNIQUE INDEX uq_lite_users_username ON lite_users(username)")
    op.execute("CREATE INDEX ix_lite_users_id_visible ON lite_users USING hash (id) WHERE is_visible")
    op.execute("CREATE INDEX ix_lite_users_username_visible ON lite_users USING hash (username) WHERE is_visible")
    op.execute("CREATE INDEX idx_lite_users_geom ON lite_users USING gist (geom)")

    op.drop_index("ix_moderation_states_type_visibility", table_name="moderation_states")
    op.drop_index("ix_users_completed_profile")
