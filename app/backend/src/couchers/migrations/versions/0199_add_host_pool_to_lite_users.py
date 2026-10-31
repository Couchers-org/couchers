"""Add host pool to lite_users

Revision ID: 0199
Revises: 0198
Create Date: 2026-11-01 00:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0199"
down_revision = "0198"
branch_labels = None
depends_on = None


HOST_POOL_COLUMN = """
            CASE
                WHEN (
                    EXISTS (
                        SELECT "references".id
                        FROM "references"
                        JOIN moderation_states ON moderation_states.id = "references".moderation_state_id
                        JOIN users AS reference_author ON reference_author.id = "references".from_user_id
                        WHERE "references".to_user_id = users.id
                            AND moderation_states.visibility = 'visible'
                            AND reference_author.banned_at IS NULL
                            AND reference_author.shadowed_at IS NULL
                            AND (
                                "references".reference_type = 'friend'
                                OR EXISTS (
                                    SELECT references_1.id
                                    FROM "references" AS references_1
                                    WHERE references_1.host_request_id = "references".host_request_id
                                        AND references_1.from_user_id = "references".to_user_id
                                        AND references_1.reference_type != 'friend'
                                )
                                OR EXISTS (
                                    SELECT host_requests.id
                                    FROM host_requests
                                    WHERE host_requests.id = "references".host_request_id
                                        AND timezone(
                                            coalesce(
                                                (SELECT timezone_areas.tzid FROM timezone_areas WHERE ST_Contains(timezone_areas.geom, host_requests.hosting_location) LIMIT 1),
                                                'Etc/UTC'
                                            ),
                                            CAST(host_requests.to_date AS TIMESTAMP WITHOUT TIME ZONE)
                                        ) + interval '15 days' < now()
                                )
                            )
                    )
                    OR EXISTS (
                        SELECT user_response_rates.user_id
                        FROM user_response_rates
                        WHERE user_response_rates.user_id = users.id
                            AND (user_response_rates.requests > 5 OR user_response_rates.response_time_66p > make_interval(secs => 345600.0))
                    )
                ) THEN 'normal'
                WHEN (users.hosting_status = 'can_host'
                    AND users.profile_gallery_id IS NOT NULL
                    AND EXISTS (SELECT 1 AS anon_2 FROM photo_gallery_items WHERE photo_gallery_items.gallery_id = users.profile_gallery_id)
                    AND users.about_me_length >= 150
                    AND length(users.about_place) > 50
                ) THEN 'newbie'
                ELSE 'incomplete'
            END AS host_pool,"""


def _create_lite_users(with_host_pool: bool) -> None:
    host_pool_column = HOST_POOL_COLUMN if with_host_pool else ""
    op.execute("DROP MATERIALIZED VIEW IF EXISTS lite_users")
    op.execute(f"""
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
            users.shadowed_at,
            uploads.filename AS avatar_filename,
            ((users.profile_gallery_id IS NOT NULL)
                AND EXISTS (SELECT 1 AS anon_1 FROM photo_gallery_items WHERE photo_gallery_items.gallery_id = users.profile_gallery_id)
                AND users.about_me_length >= 150) AS has_completed_profile,
            ((users.max_guests IS NOT NULL) AND (users.sleeping_arrangement IS NOT NULL) AND ((users.about_place IS NOT NULL) OR (users.other_host_info IS NOT NULL) OR (users.sleeping_details IS NOT NULL) OR (users.area IS NOT NULL) OR (users.house_rules IS NOT NULL))) AS has_completed_my_home,
            COALESCE(sv_subquery."true", false) AS has_strong_verification,{host_pool_column}
            CAST(json_build_object(
                'type', 'Feature',
                'geometry', CAST(ST_AsGeoJSON(users.geom, 5) AS json),
                'properties', json_build_object('id', users.id, 'has_completed_profile',
                    ((users.profile_gallery_id IS NOT NULL)
                        AND EXISTS (SELECT 1 AS anon_{3 if with_host_pool else 2} FROM photo_gallery_items WHERE photo_gallery_items.gallery_id = users.profile_gallery_id)
                        AND users.about_me_length >= 150))
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
            FROM strong_verification_attempts JOIN users users_1 ON users_1.id = strong_verification_attempts.user_id
            WHERE
                (strong_verification_attempts.user_id = users_1.id AND (strong_verification_attempts.status = 'succeeded')
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


def upgrade() -> None:
    _create_lite_users(with_host_pool=True)


def downgrade() -> None:
    _create_lite_users(with_host_pool=False)
