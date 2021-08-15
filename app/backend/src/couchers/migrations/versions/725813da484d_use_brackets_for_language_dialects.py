"""Use brackets for language dialects

Revision ID: 725813da484d
Revises: 217651c73ca8
Create Date: 2021-08-15 14:23:39.427895

"""
from alembic import op
from sqlalchemy.orm.session import Session

from couchers.resources import copy_resources_to_database

# revision identifiers, used by Alembic.
revision = "725813da484d"
down_revision = "217651c73ca8"
branch_labels = None
depends_on = None


def upgrade():
    session = Session(bind=op.get_bind())
    copy_resources_to_database(session)
    session.commit()


def downgrade():
    pass
