"""Drop unsupported languages

Revision ID: 217651c73ca8
Revises: e938e80b67a4
Create Date: 2021-07-23 14:24:10.552662

"""

from alembic import op
from sqlalchemy.orm.session import Session

from couchers.resources import copy_resources_to_database

# revision identifiers, used by Alembic.
revision = "217651c73ca8"
down_revision = "e938e80b67a4"
branch_labels = None
depends_on = None


def upgrade():
    session = Session(bind=op.get_bind())
    copy_resources_to_database(session)
    session.commit()


def downgrade():
    pass
