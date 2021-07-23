"""Add contributor form time created

Revision ID: f2abd32dee6e
Revises: e938e80b67a4
Create Date: 2021-07-23 13:14:54.695201

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "f2abd32dee6e"
down_revision = "e938e80b67a4"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "contributor_forms",
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )


def downgrade():
    op.drop_column("contributor_forms", "created")
