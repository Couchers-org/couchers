"""Add public trips

Revision ID: 981fb62b20ce
Revises: e9190b051324
Create Date: 2026-01-22 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0139"
down_revision = "0138"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create public_trips table
    op.create_table(
        "public_trips",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("node_id", sa.BigInteger(), nullable=False),
        sa.Column("from_date", sa.Date(), nullable=False),
        sa.Column("to_date", sa.Date(), nullable=False),
        sa.Column("description", sa.String(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("searching_for_host", "closed", name="publictripstatus"),
            nullable=False,
        ),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("from_date <= to_date", name=op.f("ck_public_trips_valid_date_range")),
        sa.ForeignKeyConstraint(["node_id"], ["nodes.id"], name=op.f("fk_public_trips_node_id_nodes")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_public_trips_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_public_trips")),
    )
    op.create_index(op.f("ix_public_trips_node_id"), "public_trips", ["node_id"], unique=False)
    op.create_index(op.f("ix_public_trips_user_id"), "public_trips", ["user_id"], unique=False)
    op.create_index(
        "ix_public_trips_node_from_date_active",
        "public_trips",
        ["node_id", "from_date"],
        unique=False,
        postgresql_where=sa.text("status = 'searching_for_host'"),
    )

    # Add public_trip_id to host_requests
    op.add_column("host_requests", sa.Column("public_trip_id", sa.BigInteger(), nullable=True))
    op.create_index(op.f("ix_host_requests_public_trip_id"), "host_requests", ["public_trip_id"], unique=False)
    op.create_foreign_key(
        op.f("fk_host_requests_public_trip_id_public_trips"),
        "host_requests",
        "public_trips",
        ["public_trip_id"],
        ["id"],
    )


def downgrade() -> None:
    # Remove public_trip_id from host_requests
    op.drop_constraint(op.f("fk_host_requests_public_trip_id_public_trips"), "host_requests", type_="foreignkey")
    op.drop_index(op.f("ix_host_requests_public_trip_id"), table_name="host_requests")
    op.drop_column("host_requests", "public_trip_id")

    # Drop public_trips table
    op.drop_index("ix_public_trips_node_from_date_active", table_name="public_trips")
    op.drop_index(op.f("ix_public_trips_user_id"), table_name="public_trips")
    op.drop_index(op.f("ix_public_trips_node_id"), table_name="public_trips")
    op.drop_table("public_trips")

    # Drop enum
    sa.Enum(name="publictripstatus").drop(op.get_bind(), checkfirst=True)
