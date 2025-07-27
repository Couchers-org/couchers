"""Add my home completeness

Revision ID: 888ec31ad793
Revises: c29307a66e4b
Create Date: 2025-07-27 18:50:11.427303

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "888ec31ad793"
down_revision = "c29307a66e4b"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("DROP MATERIALIZED VIEW lite_users;")
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
            ((users.avatar_key IS NOT NULL) AND (character_length(users.about_me) >= 150)) AS has_completed_profile,
            max_guests IS NOT NULL
            AND sleeping_arrangement IS NOT NULL
            AND (
                about_place IS NOT NULL
                OR other_host_info IS NOT NULL
                OR sleeping_details IS NOT NULL
                OR area IS NOT NULL
                OR house_rules IS NOT NULL
            ) AS has_completed_profile,
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
        CREATE INDEX uq_lite_users_id_visible ON lite_users(id) WHERE is_visible;
        CREATE INDEX uq_lite_users_username_visible ON lite_users(username) WHERE is_visible;
    """
    )


def downgrade():
    raise Exception("Can't downgrade")
