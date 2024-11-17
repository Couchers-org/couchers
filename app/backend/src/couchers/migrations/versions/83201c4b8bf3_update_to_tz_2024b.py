"""Update to tz 2024b

Revision ID: 83201c4b8bf3
Revises: 9c0b3af4feb6
Create Date: 2024-09-25 19:53:01.856764

"""

from alembic import op
from sqlalchemy.orm.session import Session

from couchers.resources import copy_resources_to_database

# revision identifiers, used by Alembic.
revision = "83201c4b8bf3"
down_revision = "9c0b3af4feb6"
branch_labels = None
depends_on = None


def upgrade():
    session = Session(bind=op.get_bind())
    copy_resources_to_database(session)
    session.commit()


def downgrade():
    raise Exception("Can't downgrade")
