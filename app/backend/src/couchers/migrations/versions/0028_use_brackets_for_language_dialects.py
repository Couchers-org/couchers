"""Use brackets for language dialects

Revision ID: 0028
Revises: 0027
Create Date: 2021-08-15 14:23:39.427895

"""

from alembic import op
from sqlalchemy.orm.session import Session

from couchers.resources import copy_resources_to_database

# revision identifiers, used by Alembic.
revision = "0028"
down_revision = "0027"
branch_labels = None
depends_on = None


def upgrade() -> None:
    session = Session(bind=op.get_bind())
    copy_resources_to_database(session)
    session.commit()


def downgrade() -> None:
    pass
