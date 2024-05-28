"""Update notification enums for event cancellation/deletion

Revision ID: 71efe49ea92f
Revises: 46e6b6a3d9ed
Create Date: 2024-05-29 00:16:26.791019

"""
from alembic import op
import sqlalchemy as sa
import geoalchemy2
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '71efe49ea92f'
down_revision = '46e6b6a3d9ed'
branch_labels = None
depends_on = None


def upgrade():
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'event__cancel'")
        op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'event__delete'")


def downgrade():
    raise Exception("Can't downgrade")
