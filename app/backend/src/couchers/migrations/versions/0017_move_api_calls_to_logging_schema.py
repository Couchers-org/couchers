"""Move api_calls to logging schema

Revision ID: 0017
Revises: 0016
Create Date: 2021-06-25 09:06:24.763694

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0017"
down_revision = "0016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS logging")
    op.execute("ALTER TABLE api_calls SET SCHEMA logging")


def downgrade() -> None:
    op.execute("ALTER TABLE api_calls SET SCHEMA public")
    op.execute("DROP SCHEMA IF EXISTS logging")
