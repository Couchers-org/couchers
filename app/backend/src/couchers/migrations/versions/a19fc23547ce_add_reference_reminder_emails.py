"""Add reference reminder emails

Revision ID: a19fc23547ce
Revises: 62fcd41e4dcd
Create Date: 2021-07-13 01:18:08.138793

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "a19fc23547ce"
down_revision = "62fcd41e4dcd"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE backgroundjobtype ADD VALUE 'send_reference_reminders'")


def downgrade():
    pass
