"""Add new languages to database

Revision ID: a84888e4cb0a
Revises: dc57b0bfab39
Create Date: 2024-12-13 20:52:46.143053

"""

from alembic import op
from sqlalchemy.orm.session import Session

from couchers.resources import copy_resources_to_database

# revision identifiers, used by Alembic.
revision = "a84888e4cb0a"
down_revision = "dc57b0bfab39"
branch_labels = None
depends_on = None


def upgrade():
    session = Session(bind=op.get_bind())
    copy_resources_to_database(session)
    session.commit()


def downgrade():
    raise Exception("Can't downgrade")
