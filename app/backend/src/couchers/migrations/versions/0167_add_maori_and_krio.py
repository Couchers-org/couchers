"""Add Māori and Krio

Revision ID: 0167
Revises: 0166
Create Date: 2026-06-17 00:00:00.000000

"""

from alembic import op
from sqlalchemy.orm.session import Session

from couchers.resources import copy_resources_to_database

# revision identifiers, used by Alembic.
revision = "0167"
down_revision = "0166"
branch_labels = None
depends_on = None


def upgrade() -> None:
    session = Session(bind=op.get_bind())
    copy_resources_to_database(session)
    session.commit()


def downgrade() -> None:
    raise Exception("Can't downgrade")
