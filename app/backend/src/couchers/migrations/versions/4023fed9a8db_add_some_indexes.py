"""Add some indexes

Revision ID: 4023fed9a8db
Revises: 8121c15b01c0
Create Date: 2022-10-13 10:32:12.203554

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "4023fed9a8db"
down_revision = "8121c15b01c0"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index(
        "ix_users_geom_active",
        "users",
        ["geom", "id", "username"],
        unique=False,
        postgresql_where=sa.text("NOT is_banned AND NOT is_deleted AND geom IS NOT NULL"),
    )

    op.create_index(
        "ix_background_jobs_lookup",
        "background_jobs",
        ["next_attempt_after", (sa.column("max_tries") - sa.column("try_count"))],
        unique=False,
        postgresql_where=sa.text("state = 'pending' OR state = 'error'"),
    )


def downgrade():
    raise Exception("Can't downgrade")
