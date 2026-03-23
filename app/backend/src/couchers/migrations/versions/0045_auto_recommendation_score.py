"""Auto recommendation score

Revision ID: 0045
Revises: 0044
Create Date: 2022-03-26 13:50:45.491388

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0045"
down_revision = "0044"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE users RENAME COLUMN daily_order_key TO recommendation_score")
    op.execute("ALTER TYPE backgroundjobtype ADD VALUE 'update_recommendation_scores'")


def downgrade() -> None:
    pass
