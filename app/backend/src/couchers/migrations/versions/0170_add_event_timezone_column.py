"""Add event timezone column

Revision ID: 0170
Revises: 0169
Create Date: 2026-07-02 13:47:21.368662

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0170"
down_revision = "0169"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("event_occurrences", sa.Column("timezone", sa.String(), nullable=True))

    op.execute(
        """
        UPDATE event_occurrences
        SET timezone = (
            SELECT tzid
            FROM timezone_areas
            WHERE ST_Contains(timezone_areas.geom, event_occurrences.geom)
            LIMIT 1
        )
        WHERE event_occurrences.geom IS NOT NULL
        """
    )

    op.execute(
        """
        UPDATE event_occurrences
        SET timezone = 'Etc/UTC'
        WHERE timezone IS NULL
        """
    )

    op.alter_column("event_occurrences", "timezone", nullable=False)


def downgrade() -> None:
    op.drop_column("event_occurrences", "timezone")
