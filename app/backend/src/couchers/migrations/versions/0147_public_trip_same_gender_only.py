"""Add same_gender_only to public_trips

Revision ID: 0147
Revises: 0146
Create Date: 2026-04-27 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0147"
down_revision = "0146"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "public_trips",
        sa.Column("same_gender_only", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade():
    op.drop_column("public_trips", "same_gender_only")
