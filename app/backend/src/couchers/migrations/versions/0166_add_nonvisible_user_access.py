"""Add nonvisible_user_access table

Revision ID: 0166
Revises: 0165
Create Date: 2026-06-13 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0166"
down_revision = "0165"
branch_labels = None
depends_on = None


def upgrade() -> None:
    access_type_enum = sa.Enum(
        "login_attempt", "profile_view", "ghost_served", name="nonvisibleuseraccesstype", schema="public"
    )
    state_enum = sa.Enum("banned", "shadowed", "deleted", name="nonvisibleuserstate", schema="public")

    op.create_table(
        "nonvisible_user_access",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("time", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("version", sa.String(), nullable=False),
        sa.Column("access_type", access_type_enum, nullable=False),
        sa.Column("target_user_id", sa.BigInteger(), nullable=False),
        sa.Column("target_state", state_enum, nullable=False),
        sa.Column("actor_user_id", sa.BigInteger(), nullable=True),
        sa.Column("ip_address", sa.String(), nullable=True),
        sa.Column("user_agent", sa.String(), nullable=True),
        sa.Column("sofa", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_nonvisible_user_access")),
        schema="logging",
    )
    op.create_index(
        "ix_logging_nonvisible_user_access_target_user_id_time",
        "nonvisible_user_access",
        ["target_user_id", "time"],
        schema="logging",
    )
    op.create_index(
        "ix_logging_nonvisible_user_access_actor_user_id_time",
        "nonvisible_user_access",
        ["actor_user_id", "time"],
        schema="logging",
    )
    op.create_index("ix_logging_nonvisible_user_access_sofa", "nonvisible_user_access", ["sofa"], schema="logging")
    op.create_index(
        "ix_logging_nonvisible_user_access_ip_address", "nonvisible_user_access", ["ip_address"], schema="logging"
    )


def downgrade() -> None:
    op.drop_index("ix_logging_nonvisible_user_access_ip_address", table_name="nonvisible_user_access", schema="logging")
    op.drop_index("ix_logging_nonvisible_user_access_sofa", table_name="nonvisible_user_access", schema="logging")
    op.drop_index(
        "ix_logging_nonvisible_user_access_actor_user_id_time",
        table_name="nonvisible_user_access",
        schema="logging",
    )
    op.drop_index(
        "ix_logging_nonvisible_user_access_target_user_id_time",
        table_name="nonvisible_user_access",
        schema="logging",
    )
    op.drop_table("nonvisible_user_access", schema="logging")

    sa.Enum(name="nonvisibleuserstate", schema="public").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="nonvisibleuseraccesstype", schema="public").drop(op.get_bind(), checkfirst=True)
