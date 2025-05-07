"""added host request reminders

Revision ID: 18d100ed2803
Revises: cd456767d2f7
Create Date: 2025-06-18 00:58:42.474471

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = '18d100ed2803'
down_revision = 'cd456767d2f7'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'host_request__reminder'")
    op.add_column('host_requests', sa.Column('host_sent_request_reminders', sa.BigInteger(), server_default=sa.text('0'), nullable=False))
    op.add_column('host_requests', sa.Column('last_sent_request_reminder_time', sa.DateTime(), server_default=sa.text('now()'), nullable=False))
    op.create_index('ix_host_pending_requests', 'host_requests', [sa.text("(status = 'pending')")], unique=False)
    op.create_index('ix_host_requests_last_reminder_time', 'host_requests', ['last_sent_request_reminder_time'], unique=False)
    op.create_index('ix_host_requests_start_time', 'host_requests', [sa.text("timezone('Etc/UTC', CAST(from_date AS TIMESTAMP WITHOUT TIME ZONE))")], unique=False)
    op.create_index('ix_host_requests_status_reminder_counts', 'host_requests', ['status', 'host_sent_request_reminders', 'last_sent_request_reminder_time', sa.text("timezone('Etc/UTC', CAST(from_date AS TIMESTAMP WITHOUT TIME ZONE))")], unique=False)


def downgrade():
    raise Exception("Can't downgrade")
