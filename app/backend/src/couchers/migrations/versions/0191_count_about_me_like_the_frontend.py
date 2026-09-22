"""Count about_me the way the frontend does

Revision ID: 0191
Revises: 0190
Create Date: 2026-09-22 12:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0191"
down_revision = "0190"
branch_labels = None
depends_on = None


# the browser shows a live character counter while the profile is written, so the backend has to count the same way:
# surrounding whitespace stripped (the set Javascript's trim() strips), then utf16 code units, which is one per code
# point plus one extra for every character outside the BMP. Kept in sync with
# couchers.helpers.text_length.trimmed_utf16_length_sql
_JS_WHITESPACE_CODE_POINTS = (
    0x09,
    0x0A,
    0x0B,
    0x0C,
    0x0D,
    0x20,
    0xA0,
    0x1680,
    *range(0x2000, 0x200B),
    0x2028,
    0x2029,
    0x202F,
    0x205F,
    0x3000,
    0xFEFF,
)
_JS_WHITESPACE_CLASS = "[" + "".join(f"\\u{code_point:04X}" for code_point in _JS_WHITESPACE_CODE_POINTS) + "]"
_TRIMMED = f"regexp_replace(about_me, '^{_JS_WHITESPACE_CLASS}+|{_JS_WHITESPACE_CLASS}+$', '', 'g')"
NEW_ABOUT_ME_LENGTH = (
    f"coalesce(character_length({_TRIMMED}) "
    rf"+ character_length(regexp_replace({_TRIMMED}, '[^\U00010000-\U0010FFFF]', '', 'g')), 0)"
)
OLD_ABOUT_ME_LENGTH = "coalesce(character_length(about_me), 0)"


# lite_users reads users.about_me_length, so it has to be dropped before the column can be replaced; the definition is
# unchanged from 0183
def _create_lite_users() -> None:
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
            users.shadowed_at,
            uploads.filename AS avatar_filename,
            ((users.profile_gallery_id IS NOT NULL)
                AND EXISTS (SELECT 1 AS anon_1 FROM photo_gallery_items WHERE photo_gallery_items.gallery_id = users.profile_gallery_id)
                AND users.about_me_length >= 150) AS has_completed_profile,
            ((users.max_guests IS NOT NULL) AND (users.sleeping_arrangement IS NOT NULL) AND ((users.about_place IS NOT NULL) OR (users.other_host_info IS NOT NULL) OR (users.sleeping_details IS NOT NULL) OR (users.area IS NOT NULL) OR (users.house_rules IS NOT NULL))) AS has_completed_my_home,
            COALESCE(sv_subquery."true", false) AS has_strong_verification,
            CAST(json_build_object(
                'type', 'Feature',
                'geometry', CAST(ST_AsGeoJSON(users.geom, 5) AS json),
                'properties', json_build_object('id', users.id, 'has_completed_profile',
                    ((users.profile_gallery_id IS NOT NULL)
                        AND EXISTS (SELECT 1 AS anon_2 FROM photo_gallery_items WHERE photo_gallery_items.gallery_id = users.profile_gallery_id)
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


def _replace_about_me_length(expression: str) -> None:
    op.execute("DROP MATERIALIZED VIEW IF EXISTS lite_users")
    op.execute("DROP INDEX ix_users_visible_with_about_me")
    # rewrites the table under an ACCESS EXCLUSIVE lock, and detoasts every about_me one final time
    op.execute("ALTER TABLE users DROP COLUMN about_me_length")
    op.execute(
        f"ALTER TABLE users ADD COLUMN about_me_length integer NOT NULL GENERATED ALWAYS AS ({expression}) STORED"
    )
    op.execute("""
        CREATE INDEX ix_users_visible_with_about_me ON users (id)
        WHERE banned_at IS NULL
          AND deleted_at IS NULL
          AND profile_gallery_id IS NOT NULL
          AND about_me_length >= 150
    """)
    _create_lite_users()


def upgrade() -> None:
    _replace_about_me_length(NEW_ABOUT_ME_LENGTH)


def downgrade() -> None:
    _replace_about_me_length(OLD_ABOUT_ME_LENGTH)
