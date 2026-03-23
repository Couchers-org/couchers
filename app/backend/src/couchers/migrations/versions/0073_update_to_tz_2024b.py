"""Update to tz 2024b

Revision ID: 0073
Revises: 0072
Create Date: 2024-09-25 19:53:01.856764

"""

from alembic import op
from sqlalchemy.orm.session import Session

from couchers.resources import copy_resources_to_database

# revision identifiers, used by Alembic.
revision = "0073"
down_revision = "0072"
branch_labels = None
depends_on = None


def upgrade() -> None:
    session = Session(bind=op.get_bind())
    copy_resources_to_database(session)
    session.commit()


def downgrade() -> None:
    raise Exception("Can't downgrade")
