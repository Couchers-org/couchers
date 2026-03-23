"""Update volunteer table

Revision ID: 0107
Revises: 0106
Create Date: 2025-07-27 14:16:32.183830

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0107"
down_revision = "0106"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_unique_constraint(op.f("uq_volunteers_user_id"), "volunteers", ["user_id"])


def downgrade() -> None:
    op.drop_constraint(op.f("uq_volunteers_user_id"), "volunteers", type_="unique")
