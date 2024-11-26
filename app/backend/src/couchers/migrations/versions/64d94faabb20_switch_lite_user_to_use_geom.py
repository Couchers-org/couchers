"""Switch lite_user to use geom

Revision ID: 64d94faabb20
Revises: 6db90129a4da
Create Date: 2024-10-25 10:40:23.121398

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "64d94faabb20"
down_revision = "6db90129a4da"
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
            users.geom as geom,
            users.geom_radius as radius,
            not (users.is_banned or users.is_deleted) as is_visible,
            uploads.filename as avatar_filename,
            (users.avatar_key is not null) and character_length(users.about_me) >= 150 as has_completed_profile
        FROM users
        LEFT OUTER JOIN uploads
        ON uploads.key = users.avatar_key;
        CREATE INDEX idx_lite_users_geom ON lite_users USING gist (geom);
        CREATE UNIQUE INDEX uq_lite_users_id ON lite_users(id);
    """
    )


def downgrade():
    raise Exception("Can't downgrade")
