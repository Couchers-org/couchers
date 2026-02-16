"""Replace is_banned/is_deleted with banned_at/deleted_at

Revision ID: eeae61c8ee09
Revises: 738c3c9f922e
Create Date: 2026-02-15 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "eeae61c8ee09"
down_revision = "738c3c9f922e"
branch_labels = None
depends_on = None


def upgrade():
    # Add new timestamp columns
    op.add_column("users", sa.Column("banned_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))

    # Backfill: set timestamp to now() for users that were banned/deleted
    op.execute("UPDATE users SET banned_at = now() WHERE is_banned = TRUE")
    op.execute("UPDATE users SET deleted_at = now() WHERE is_deleted = TRUE")

    # Drop all materialized views that reference old columns
    op.execute("DROP MATERIALIZED VIEW IF EXISTS lite_users")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS clustered_users")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS cluster_subscription_counts")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS cluster_admin_counts")

    # Drop old indexes that reference the old columns
    op.drop_index("ix_users_active")
    op.drop_index("ix_users_geom_active")
    op.drop_index("ix_users_by_id")
    op.drop_index("ix_users_by_username")

    # Drop old constraint that references is_deleted
    op.drop_constraint("undelete_nullity", "users", type_="check")

    # Drop old boolean columns
    op.drop_column("users", "is_banned")
    op.drop_column("users", "is_deleted")

    # Recreate indexes with new column references
    op.create_index(
        "ix_users_active",
        "users",
        ["id"],
        postgresql_where=sa.text("banned_at IS NULL AND deleted_at IS NULL"),
    )
    op.create_index(
        "ix_users_geom_active",
        "users",
        ["geom", "id", "username"],
        postgresql_using="gist",
        postgresql_where=sa.text("banned_at IS NULL AND deleted_at IS NULL"),
    )
    op.create_index(
        "ix_users_by_id",
        "users",
        ["id"],
        postgresql_using="hash",
        postgresql_where=sa.text("banned_at IS NULL AND deleted_at IS NULL"),
    )
    op.create_index(
        "ix_users_by_username",
        "users",
        ["username"],
        postgresql_using="hash",
        postgresql_where=sa.text("banned_at IS NULL AND deleted_at IS NULL"),
    )

    # Recreate constraint with new column reference
    op.create_check_constraint(
        "undelete_nullity",
        "users",
        "((undelete_token IS NULL) = (undelete_until IS NULL)) AND ((undelete_token IS NULL) OR deleted_at IS NOT NULL)",
    )

    # Recreate cluster_subscription_counts with new columns
    op.execute("""
        CREATE MATERIALIZED VIEW cluster_subscription_counts AS
        SELECT cluster_subscriptions.cluster_id, count(*) AS count
        FROM cluster_subscriptions
        LEFT OUTER JOIN users ON users.id = cluster_subscriptions.user_id
        WHERE users.banned_at IS NULL AND users.deleted_at IS NULL
        GROUP BY cluster_subscriptions.cluster_id
    """)
    op.execute(
        "CREATE UNIQUE INDEX uq_cluster_subscription_counts_cluster_id ON cluster_subscription_counts(cluster_id)"
    )

    # Recreate cluster_admin_counts with new columns
    op.execute("""
        CREATE MATERIALIZED VIEW cluster_admin_counts AS
        SELECT cluster_subscriptions.cluster_id, count(*) AS count
        FROM cluster_subscriptions
        LEFT OUTER JOIN users ON users.id = cluster_subscriptions.user_id
        WHERE cluster_subscriptions.role = 'admin' AND users.banned_at IS NULL AND users.deleted_at IS NULL
        GROUP BY cluster_subscriptions.cluster_id
    """)
    op.execute("CREATE UNIQUE INDEX uq_cluster_admin_counts_cluster_id ON cluster_admin_counts(cluster_id)")

    # Recreate clustered_users with new columns
    op.execute("""
        CREATE MATERIALIZED VIEW clustered_users AS
        WITH clustered AS (
            SELECT
                users.id AS id,
                users.geom AS geom,
                ST_ClusterDBSCAN(users.geom, 0.15, 5) OVER (ORDER BY users.id) AS cluster_id
            FROM users
            WHERE users.banned_at IS NULL AND users.deleted_at IS NULL
        )
        SELECT
            ST_Centroid(ST_Collect(clustered.geom)) AS geom,
            count(*) AS count
        FROM clustered
        WHERE clustered.cluster_id IS NOT NULL
        GROUP BY clustered.cluster_id
        UNION ALL
        SELECT
            clustered.geom AS geom,
            1 AS count
        FROM clustered
        WHERE clustered.cluster_id IS NULL
    """)
    op.execute("CREATE INDEX idx_clustered_users_geom ON clustered_users USING gist (geom)")

    # Recreate lite_users with new columns
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


def downgrade():
    # Drop all materialized views that reference new columns
    op.execute("DROP MATERIALIZED VIEW IF EXISTS lite_users")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS clustered_users")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS cluster_subscription_counts")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS cluster_admin_counts")

    # Add back old boolean columns
    op.add_column(
        "users",
        sa.Column("is_banned", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )
    op.add_column(
        "users",
        sa.Column("is_deleted", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )

    # Backfill: set boolean flags from timestamps
    op.execute("UPDATE users SET is_banned = TRUE WHERE banned_at IS NOT NULL")
    op.execute("UPDATE users SET is_deleted = TRUE WHERE deleted_at IS NOT NULL")

    # Drop new indexes
    op.drop_index("ix_users_active")
    op.drop_index("ix_users_geom_active")
    op.drop_index("ix_users_by_id")
    op.drop_index("ix_users_by_username")

    # Drop new constraint
    op.drop_constraint("undelete_nullity", "users", type_="check")

    # Drop new timestamp columns
    op.drop_column("users", "banned_at")
    op.drop_column("users", "deleted_at")

    # Recreate indexes with old column references
    op.create_index(
        "ix_users_active",
        "users",
        ["id"],
        postgresql_where=sa.text("NOT is_banned AND NOT is_deleted"),
    )
    op.create_index(
        "ix_users_geom_active",
        "users",
        ["geom", "id", "username"],
        postgresql_using="gist",
        postgresql_where=sa.text("NOT is_banned AND NOT is_deleted"),
    )
    op.create_index(
        "ix_users_by_id",
        "users",
        ["id"],
        postgresql_using="hash",
        postgresql_where=sa.text("NOT is_banned AND NOT is_deleted"),
    )
    op.create_index(
        "ix_users_by_username",
        "users",
        ["username"],
        postgresql_using="hash",
        postgresql_where=sa.text("NOT is_banned AND NOT is_deleted"),
    )

    # Recreate constraint with old column reference
    op.create_check_constraint(
        "undelete_nullity",
        "users",
        "((undelete_token IS NULL) = (undelete_until IS NULL)) AND ((undelete_token IS NULL) OR is_deleted)",
    )

    # Recreate cluster_subscription_counts with old columns
    op.execute("""
        CREATE MATERIALIZED VIEW cluster_subscription_counts AS
        SELECT cluster_subscriptions.cluster_id, count(*) AS count
        FROM cluster_subscriptions
        LEFT OUTER JOIN users ON users.id = cluster_subscriptions.user_id
        WHERE NOT (users.is_banned OR users.is_deleted)
        GROUP BY cluster_subscriptions.cluster_id
    """)
    op.execute(
        "CREATE UNIQUE INDEX uq_cluster_subscription_counts_cluster_id ON cluster_subscription_counts(cluster_id)"
    )

    # Recreate cluster_admin_counts with old columns
    op.execute("""
        CREATE MATERIALIZED VIEW cluster_admin_counts AS
        SELECT cluster_subscriptions.cluster_id, count(*) AS count
        FROM cluster_subscriptions
        LEFT OUTER JOIN users ON users.id = cluster_subscriptions.user_id
        WHERE cluster_subscriptions.role = 'admin' AND NOT (users.is_banned OR users.is_deleted)
        GROUP BY cluster_subscriptions.cluster_id
    """)
    op.execute("CREATE UNIQUE INDEX uq_cluster_admin_counts_cluster_id ON cluster_admin_counts(cluster_id)")

    # Recreate clustered_users with old columns
    op.execute("""
        CREATE MATERIALIZED VIEW clustered_users AS
        WITH clustered AS (
            SELECT
                users.id AS id,
                users.geom AS geom,
                ST_ClusterDBSCAN(users.geom, 0.15, 5) OVER (ORDER BY users.id) AS cluster_id
            FROM users
            WHERE NOT (users.is_banned OR users.is_deleted)
        )
        SELECT
            ST_Centroid(ST_Collect(clustered.geom)) AS geom,
            count(*) AS count
        FROM clustered
        WHERE clustered.cluster_id IS NOT NULL
        GROUP BY clustered.cluster_id
        UNION ALL
        SELECT
            clustered.geom AS geom,
            1 AS count
        FROM clustered
        WHERE clustered.cluster_id IS NULL
    """)
    op.execute("CREATE INDEX idx_clustered_users_geom ON clustered_users USING gist (geom)")

    # Recreate lite_users materialized view with old columns
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
