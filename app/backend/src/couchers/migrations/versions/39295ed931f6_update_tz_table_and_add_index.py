"""Update tz table and add index

Revision ID: 39295ed931f6
Revises: 13fe6ada1535
Create Date: 2022-02-14 13:18:46.176547

"""
from alembic import op

from couchers.resources import copy_resources_to_database

# revision identifiers, used by Alembic.
revision = "39295ed931f6"
down_revision = "13fe6ada1535"
branch_labels = None
depends_on = None


def upgrade():
    session = Session(bind=op.get_bind())
    copy_resources_to_database(session)
    session.commit()

    op.create_index(
        "ix_timezone_areas_geom_tzid", "timezone_areas", ["geom", "tzid"], unique=False, postgresql_using="gist"
    )


def downgrade():
    op.drop_index("ix_timezone_areas_geom_tzid", table_name="timezone_areas", postgresql_using="gist")
