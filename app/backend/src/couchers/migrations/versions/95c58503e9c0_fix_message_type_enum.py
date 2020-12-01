"""Fix message type enum

Revision ID: 95c58503e9c0
Revises: 3c0f67ff3ea2
Create Date: 2020-11-21 11:57:37.853004

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "95c58503e9c0"
down_revision = "3c0f67ff3ea2"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE messagetype ADD VALUE 'host_request_status_changed';")


def downgrade():
    raise Exception("I can't drop the 'host_request_status_changed' value from 'messagetype' enum.")
