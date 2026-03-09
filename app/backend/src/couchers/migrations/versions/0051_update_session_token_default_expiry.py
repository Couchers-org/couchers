"""Update session token default expiry

Revision ID: 0051
Revises: 0050
Create Date: 2024-04-18 14:26:10.920560

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0051"
down_revision = "0050"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("sessions", "expiry", server_default=sa.func.now() + sa.text("interval '730 days'"))


def downgrade() -> None:
    op.alter_column("sessions", "expiry", server_default=sa.func.now() + sa.text("interval '90 days'"))
