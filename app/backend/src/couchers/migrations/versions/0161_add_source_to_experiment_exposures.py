"""Add source to experiment_exposures

Revision ID: 0161
Revises: 0160
Create Date: 2026-05-31 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0161"
down_revision = "0160"
branch_labels = None
depends_on = None


def upgrade() -> None:
    exposuresource_enum = sa.Enum("backend", "client", name="exposuresource", schema="public")
    exposuresource_enum.create(op.get_bind(), checkfirst=True)

    # add nullable, backfill existing (all server-side) rows, then make NOT NULL
    op.add_column(
        "experiment_exposures",
        sa.Column("source", exposuresource_enum, nullable=True),
        schema="logging",
    )
    op.execute("UPDATE logging.experiment_exposures SET source = 'backend' WHERE source IS NULL")
    op.alter_column("experiment_exposures", "source", nullable=False, schema="logging")


def downgrade() -> None:
    op.drop_column("experiment_exposures", "source", schema="logging")
    sa.Enum(name="exposuresource", schema="public").drop(op.get_bind(), checkfirst=True)
