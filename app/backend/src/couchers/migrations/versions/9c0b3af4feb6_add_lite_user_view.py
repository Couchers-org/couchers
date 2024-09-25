"""Add lite user view

Revision ID: 9c0b3af4feb6
Revises: 999cf4ffb47a
Create Date: 2024-09-25 12:35:03.752059

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "9c0b3af4feb6"
down_revision = "999cf4ffb47a"
branch_labels = None
depends_on = None


def upgrade():
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
            uploads.filename as avatar_filename
        FROM users
        LEFT OUTER JOIN uploads
        ON uploads.key = users.avatar_key;

        CREATE UNIQUE INDEX uq_lite_users_id ON lite_users(id);
    """
    )


def downgrade():
    raise Exception("Can't downgrade")
