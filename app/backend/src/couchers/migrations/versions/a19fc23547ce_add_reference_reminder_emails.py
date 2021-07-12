"""Add reference reminder emails

Revision ID: a19fc23547ce
Revises: e6d03b494119
Create Date: 2021-07-13 01:18:08.138793

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "a19fc23547ce"
down_revision = "e6d03b494119"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE backgroundjobtype ADD VALUE 'send_reference_reminders'")


def downgrade():
    pass
