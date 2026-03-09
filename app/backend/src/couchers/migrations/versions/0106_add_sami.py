"""Add Sami

Revision ID: 0106
Revises: 0105
Create Date: 2025-07-27 14:13:10.555200

"""

from alembic import op
from sqlalchemy.orm.session import Session

from couchers.resources import copy_resources_to_database

# revision identifiers, used by Alembic.
revision = "0106"
down_revision = "0105"
branch_labels = None
depends_on = None


def upgrade() -> None:
    session = Session(bind=op.get_bind())
    copy_resources_to_database(session)
    session.commit()


def downgrade() -> None:
    raise Exception("Can't downgrade")
