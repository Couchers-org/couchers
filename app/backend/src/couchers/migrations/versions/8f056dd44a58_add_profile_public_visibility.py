"""Add profile public visibility

Revision ID: 8f056dd44a58
Revises: a0d344cfb455
Create Date: 2024-07-13 17:08:33.761879

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "8f056dd44a58"
down_revision = "a0d344cfb455"
branch_labels = None
depends_on = None


def upgrade():
    profilepublicvisibility = sa.Enum("nothing", "map_only", "limited", "most", "full", name="profilepublicvisibility")
    profilepublicvisibility.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "users",
        sa.Column(
            "public_visibility",
            profilepublicvisibility,
            server_default="limited",
            nullable=False,
        ),
    )
    op.add_column(
        "users",
        sa.Column("needs_to_pick_public_visibility", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )


def downgrade():
    op.drop_column("users", "needs_to_pick_public_visibility")
    op.drop_column("users", "public_visibility")
