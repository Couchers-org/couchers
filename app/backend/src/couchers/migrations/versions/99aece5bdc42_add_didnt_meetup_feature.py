"""Add didnt meetup feature

Revision ID: 99aece5bdc42
Revises: a84888e4cb0a
Create Date: 2025-01-20 18:11:22.641582

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "99aece5bdc42"
down_revision = "a84888e4cb0a"
branch_labels = None
depends_on = None


def upgrade():
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


def downgrade():
    op.drop_column("host_requests", "surfer_reason_didnt_meetup")
    op.drop_column("host_requests", "host_reason_didnt_meetup")
