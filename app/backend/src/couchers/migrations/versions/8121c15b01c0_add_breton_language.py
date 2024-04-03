"""Add Breton language

Revision ID: 8121c15b01c0
Revises: b8487ad90a52
Create Date: 2022-10-08 11:06:15.912112

"""

from alembic import op
from sqlalchemy.orm.session import Session

from couchers.resources import copy_resources_to_database

# revision identifiers, used by Alembic.
revision = "8121c15b01c0"
down_revision = "b8487ad90a52"
branch_labels = None
depends_on = None


def upgrade():
    session = Session(bind=op.get_bind())
    copy_resources_to_database(session)
    session.commit()


def downgrade():
    raise Exception("Can't downgrade")
