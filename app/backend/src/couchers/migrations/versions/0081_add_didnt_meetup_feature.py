"""Add didnt meetup feature

Revision ID: 0081
Revises: 0080
Create Date: 2025-01-20 18:11:22.641582

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0081"
down_revision = "0080"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("host_requests", sa.Column("host_reason_didnt_meetup", sa.String(), nullable=True))
    op.add_column("host_requests", sa.Column("surfer_reason_didnt_meetup", sa.String(), nullable=True))
    op.create_index(
        "ix_host_requests_host_didnt_meetup",
        "host_requests",
        [sa.text("(host_reason_didnt_meetup IS NOT NULL)")],
        unique=False,
    )
    op.create_index(
        "ix_host_requests_surfer_didnt_meetup",
        "host_requests",
        [sa.text("(surfer_reason_didnt_meetup IS NOT NULL)")],
        unique=False,
    )


def downgrade() -> None:
    op.drop_column("host_requests", "surfer_reason_didnt_meetup")
    op.drop_column("host_requests", "host_reason_didnt_meetup")
