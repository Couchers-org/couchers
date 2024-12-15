"""Add profile completeness to lite user

Revision ID: 6db90129a4da
Revises: 83201c4b8bf3
Create Date: 2024-10-25 05:50:13.015936

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "6db90129a4da"
down_revision = "83201c4b8bf3"
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
            date_part('year', age(users.birthdate)) as age,
            ST_Y(users.geom) as lat,
            ST_X(users.geom) as lng,
            users.geom_radius as radius,
            not (users.is_banned or users.is_deleted) as is_visible,
            uploads.filename as avatar_filename,
            (users.avatar_key is not null) and character_length(users.about_me) >= 150 as has_completed_profile
        FROM users
        LEFT OUTER JOIN uploads
        ON uploads.key = users.avatar_key;
        CREATE UNIQUE INDEX uq_lite_users_id ON lite_users(id);
    """
    )


def downgrade():
    raise Exception("Can't downgrade")
