"""Consolidate community discussions/events flags into one

Revision ID: 0143
Revises: 0142
Create Date: 2026-04-18 19:32:11.555092

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0143"
down_revision = "0142"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "clusters",
        sa.Column("small_community_features_enabled", sa.Boolean(), server_default=sa.text("true"), nullable=False),
    )
    # Preserve opt-outs: a community had the feature set on only if both old flags were on.
    op.execute("UPDATE clusters SET small_community_features_enabled = (discussions_enabled AND events_enabled)")
    op.drop_column("clusters", "events_enabled")
    op.drop_column("clusters", "discussions_enabled")


def downgrade() -> None:
    op.add_column(
        "clusters",
        sa.Column(
            "discussions_enabled", sa.BOOLEAN(), server_default=sa.text("true"), autoincrement=False, nullable=False
        ),
    )
    op.add_column(
        "clusters",
        sa.Column("events_enabled", sa.BOOLEAN(), server_default=sa.text("true"), autoincrement=False, nullable=False),
    )
    op.execute(
        "UPDATE clusters SET discussions_enabled = small_community_features_enabled, "
        "events_enabled = small_community_features_enabled"
    )
    op.drop_column("clusters", "small_community_features_enabled")
