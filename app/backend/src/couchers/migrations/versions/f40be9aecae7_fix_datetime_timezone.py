"""Fix datetime timezone

Revision ID: f40be9aecae7
Revises: e3815ef8b1e3
Create Date: 2025-07-26 13:59:11.384539

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "f40be9aecae7"
down_revision = "e3815ef8b1e3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "host_requests",
        "last_sent_request_reminder_time",
        existing_type=postgresql.TIMESTAMP(),
        type_=sa.DateTime(timezone=True),
        existing_nullable=False,
        existing_server_default=sa.text("now()"),
    )


def downgrade() -> None:
    op.alter_column(
        "host_requests",
        "last_sent_request_reminder_time",
        existing_type=sa.DateTime(timezone=True),
        type_=postgresql.TIMESTAMP(),
        existing_nullable=False,
        existing_server_default=sa.text("now()"),
    )
