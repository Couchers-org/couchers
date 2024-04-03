"""Auto recommendation score

Revision ID: b8487ad90a52
Revises: 39295ed931f6
Create Date: 2022-03-26 13:50:45.491388

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "b8487ad90a52"
down_revision = "39295ed931f6"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE users RENAME COLUMN daily_order_key TO recommendation_score")
    op.execute("ALTER TYPE backgroundjobtype ADD VALUE 'update_recommendation_scores'")


def downgrade():
    pass
