"""Add Sami

Revision ID: 71a33b6af395
Revises: 02156b1739ad
Create Date: 2025-07-27 14:13:10.555200

"""

from alembic import op
from sqlalchemy.orm.session import Session

from couchers.resources import copy_resources_to_database

# revision identifiers, used by Alembic.
revision = "71a33b6af395"
down_revision = "02156b1739ad"
branch_labels = None
depends_on = None


def upgrade() -> None:
    session = Session(bind=op.get_bind())
    copy_resources_to_database(session)
    session.commit()


def downgrade() -> None:
    raise Exception("Can't downgrade")
