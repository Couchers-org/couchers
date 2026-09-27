"""TEST ONLY - do not merge: exercise the migration review bot

Revision ID: 0192
Revises: 0191
Create Date: 2026-09-27 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0192"
down_revision = "0191"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("review_bot_test", sa.String(), nullable=False))
    op.create_index("ix_users_review_bot_test", "users", ["review_bot_test"])


def downgrade() -> None:
    op.drop_index("ix_users_review_bot_test", table_name="users")
    op.drop_column("users", "review_bot_test")
