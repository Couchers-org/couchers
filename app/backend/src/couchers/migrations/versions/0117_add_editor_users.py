"""Add editor users

Revision ID: 0117
Revises: 0116
Create Date: 2025-11-27 16:50:37.745770

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0117"
down_revision = "0116"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("is_editor", sa.Boolean(), server_default=sa.text("false"), nullable=False))
    op.execute("UPDATE users SET is_editor = true WHERE is_superuser = true")
    op.create_check_constraint(
        constraint_name="superuser_is_editor",
        table_name="users",
        condition="(is_superuser IS FALSE) OR (is_editor IS TRUE)",
    )


def downgrade() -> None:
    op.drop_constraint("superuser_is_editor", "users", type_="check")
    op.drop_column("users", "is_editor")
