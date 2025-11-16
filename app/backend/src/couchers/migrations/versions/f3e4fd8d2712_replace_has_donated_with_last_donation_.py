"""Replace has_donated with last_donation time

Revision ID: f3e4fd8d2712
Revises: f555ed35e4d0
Create Date: 2025-11-16 11:37:56.307803

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "f3e4fd8d2712"
down_revision = "f555ed35e4d0"
branch_labels = None
depends_on = None


def upgrade():
    op.create_unique_constraint(
        ["user_id", "moderation_list_id"],
    )
    op.add_column(
        "users", sa.Column("last_donated", sa.DateTime(timezone=True), server_default=sa.text("NULL"), nullable=True)
    )

    # Backfill last_donated from invoices table - set to the timestamp of the most recent invoice
    op.execute("""
        UPDATE users
        SET last_donated = (
            SELECT MAX(created)
            FROM invoices
            WHERE invoices.user_id = users.id
        )
        WHERE id IN (SELECT DISTINCT user_id FROM invoices)
    """)

    # For users who have has_donated=true but no invoices, set last_donated to 2023-01-01
    op.execute("""
        UPDATE users
        SET last_donated = '2023-01-01 00:00:00+00'::timestamptz
        WHERE has_donated = true
        AND last_donated IS NULL
    """)

    op.drop_column("users", "has_donated")


def downgrade():
    op.add_column(
        "users",
        sa.Column("has_donated", sa.BOOLEAN(), server_default=sa.text("false"), autoincrement=False, nullable=False),
    )
    op.drop_column("users", "last_donated")
