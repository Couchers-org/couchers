"""Update session token default expiry

Revision ID: ffe7d9a87925
Revises: 7f9f32e4b055
Create Date: 2024-04-18 14:26:10.920560

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "ffe7d9a87925"
down_revision = "7f9f32e4b055"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column("sessions", "expiry", server_default=sa.func.now() + sa.text("interval '730 days'"))


def downgrade():
    op.alter_column("sessions", "expiry", server_default=sa.func.now() + sa.text("interval '90 days'"))
