"""Add volunteers table

Revision ID: 0104
Revises: 0103
Create Date: 2025-07-26 15:39:51.915422

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0104"
down_revision = "0103"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "volunteers",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("sort_key", sa.Float(), nullable=True),
        sa.Column("started_volunteering", sa.Date(), server_default=sa.text("CURRENT_DATE"), nullable=False),
        sa.Column("stopped_volunteering", sa.Date(), nullable=True),
        sa.Column("link_type", sa.String(), nullable=True),
        sa.Column("link_text", sa.String(), nullable=True),
        sa.Column("link_url", sa.String(), nullable=True),
        sa.Column("show_on_team_page", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.CheckConstraint(
            "(link_type IS NULL) = (link_text IS NULL) AND (link_type IS NULL) = (link_url IS NULL)",
            name=op.f("ck_volunteers_link_type_text"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_volunteers_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_volunteers")),
    )


def downgrade() -> None:
    op.drop_table("volunteers")
