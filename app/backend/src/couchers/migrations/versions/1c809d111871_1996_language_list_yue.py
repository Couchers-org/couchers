"""1996_language_list_yue

Revision ID: 1c809d111871
Revises: 1e9b694d08c0
Create Date: 2021-10-16 23:31:43.298208

"""
from alembic import op
from sqlalchemy.orm.session import Session

from couchers.resources import copy_resources_to_database

# revision identifiers, used by Alembic.
revision = "1c809d111871"
down_revision = "1e9b694d08c0"
branch_labels = None
depends_on = None


def upgrade():
    session = Session(bind=op.get_bind())
    copy_resources_to_database(session)
    session.commit()


def downgrade():
    pass
