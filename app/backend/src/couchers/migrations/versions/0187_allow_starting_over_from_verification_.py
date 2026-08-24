"""Allow starting over from verification page

Revision ID: 0187
Revises: 0186
Create Date: 2026-08-24 03:01:54.582432

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0187"
down_revision = "0186"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "signup_flows",
        sa.Column(
            "signup_cancelled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    op.drop_constraint(
        op.f("uq_signup_flows_username"),
        "signup_flows",
        type_="unique",
    )

    op.create_index(
        "uq_signup_flows_username",
        "signup_flows",
        ["username"],
        unique=True,
        postgresql_where=sa.text("username IS NOT NULL AND signup_cancelled = false"),
    )

    op.alter_column(
        "signup_flows",
        "signup_cancelled",
        server_default=None,
    )


def downgrade() -> None:
    op.drop_index(
        "uq_signup_flows_username",
        table_name="signup_flows",
        postgresql_where=sa.text("username IS NOT NULL AND signup_cancelled = false"),
    )
    op.create_unique_constraint(
        op.f("uq_signup_flows_username"), "signup_flows", ["username"], postgresql_nulls_not_distinct=False
    )
<<<<<<< HEAD
    op.drop_column("signup_flows", "signup_cancelled")
=======
    op.execute("DELETE FROM signup_flows WHERE signup_cancelled")
    op.drop_column("signup_flows", "signup_cancelled")
>>>>>>> fa81c79b8 (update upgrade and downgrade to add signup_cancelled)
