"""Add edit/delete support to discussions, comments, and replies

Revision ID: 0151
Revises: 0150
Create Date: 2026-05-13 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0151"
down_revision = "0150"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "discussions",
        sa.Column("deleted", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "discussions",
        sa.Column("last_edited", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "comments",
        sa.Column("last_edited", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "replies",
        sa.Column("last_edited", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("replies", "last_edited")
    op.drop_column("comments", "last_edited")
    op.drop_column("discussions", "last_edited")
    op.drop_column("discussions", "deleted")
