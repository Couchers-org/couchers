"""Add public_trip_offer notification topic actions

Revision ID: 0195
Revises: 0194
Create Date: 2026-10-11 12:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0195"
down_revision = "0194"
branch_labels = None
depends_on = None


def upgrade() -> None:
    for action in ["create", "accept", "reject", "confirm", "cancel", "reminder"]:
        op.execute(f"ALTER TYPE notificationtopicaction ADD VALUE IF NOT EXISTS 'public_trip_offer__{action}'")


def downgrade() -> None:
    raise Exception("Can't downgrade")
