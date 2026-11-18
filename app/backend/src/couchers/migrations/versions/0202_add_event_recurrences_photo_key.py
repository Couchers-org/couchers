"""Add event_recurrences.photo_key so recurring events use a photo template for new occurrences

Revision ID: 0202
Revises: 0201
Create Date: 2026-11-18 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0202"
down_revision = "0201"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("event_recurrences", sa.Column("photo_key", sa.String(), nullable=True))
    op.create_foreign_key(
        op.f("fk_event_recurrences_photo_key_uploads"), "event_recurrences", "uploads", ["photo_key"], ["key"]
    )


def downgrade() -> None:
    op.drop_constraint(op.f("fk_event_recurrences_photo_key_uploads"), "event_recurrences", type_="foreignkey")
    op.drop_column("event_recurrences", "photo_key")
