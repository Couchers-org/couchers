"""Move api_calls to logging schema

Revision ID: 45e7e0254963
Revises: 5e89dd9ef181
Create Date: 2021-06-25 09:06:24.763694

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "45e7e0254963"
down_revision = "5e89dd9ef181"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE SCHEMA IF NOT EXISTS logging")
    op.execute("ALTER TABLE api_calls SET SCHEMA logging")


def downgrade():
    op.execute("ALTER TABLE api_calls SET SCHEMA public")
    op.execute("DROP SCHEMA IF EXISTS logging")
