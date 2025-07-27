"""Update volunteer table

Revision ID: c29307a66e4b
Revises: 02156b1739ad
Create Date: 2025-07-27 14:16:32.183830

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "c29307a66e4b"
down_revision = "02156b1739ad"
branch_labels = None
depends_on = None


def upgrade():
    op.create_unique_constraint(op.f("uq_volunteers_user_id"), "volunteers", ["user_id"])


def downgrade():
    op.drop_constraint(op.f("uq_volunteers_user_id"), "volunteers", type_="unique")
