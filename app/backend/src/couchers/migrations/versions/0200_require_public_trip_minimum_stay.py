"""Require at least one night for public trips

Revision ID: 0200
Revises: 0199
"""

from alembic import op
from sqlalchemy import text

revision = "0200"
down_revision = "0199"
branch_labels = None
depends_on = None


def upgrade() -> None:
    if op.get_bind().execute(text("SELECT 1 FROM public_trips WHERE from_date >= to_date LIMIT 1")).first():
        raise RuntimeError("Correct public trips without an overnight stay before applying migration 0200.")
    op.drop_constraint(op.f("ck_public_trips_valid_date_range"), "public_trips", type_="check")
    op.create_check_constraint(
        op.f("ck_public_trips_valid_date_range"), "public_trips", "from_date < to_date", postgresql_not_valid=True
    )
    op.execute("ALTER TABLE public_trips VALIDATE CONSTRAINT ck_public_trips_valid_date_range")


def downgrade() -> None:
    op.drop_constraint(op.f("ck_public_trips_valid_date_range"), "public_trips", type_="check")
    op.create_check_constraint(
        op.f("ck_public_trips_valid_date_range"), "public_trips", "from_date <= to_date", postgresql_not_valid=True
    )
    op.execute("ALTER TABLE public_trips VALIDATE CONSTRAINT ck_public_trips_valid_date_range")
