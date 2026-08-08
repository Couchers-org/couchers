"""Add generated surfer/host columns to host_requests

Revision ID: 0180
Revises: 0179
Create Date: 2026-08-08 10:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0180"
down_revision = "0179"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # both columns are added in one statement so the table is only rewritten once (under an ACCESS EXCLUSIVE lock)
    op.execute("""
        ALTER TABLE host_requests
        ADD COLUMN surfer_user_id bigint NOT NULL
            GENERATED ALWAYS AS (case when public_trip_id is null then initiator_user_id else recipient_user_id end) STORED,
        ADD COLUMN host_user_id bigint NOT NULL
            GENERATED ALWAYS AS (case when public_trip_id is null then recipient_user_id else initiator_user_id end) STORED
    """)
    op.create_foreign_key(
        op.f("fk_host_requests_surfer_user_id_users"), "host_requests", "users", ["surfer_user_id"], ["id"]
    )
    op.create_foreign_key(
        op.f("fk_host_requests_host_user_id_users"), "host_requests", "users", ["host_user_id"], ["id"]
    )
    op.create_index(op.f("ix_host_requests_surfer_user_id"), "host_requests", ["surfer_user_id"], unique=False)
    op.create_index(op.f("ix_host_requests_host_user_id"), "host_requests", ["host_user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_host_requests_host_user_id"), table_name="host_requests")
    op.drop_index(op.f("ix_host_requests_surfer_user_id"), table_name="host_requests")
    op.drop_constraint(op.f("fk_host_requests_host_user_id_users"), "host_requests", type_="foreignkey")
    op.drop_constraint(op.f("fk_host_requests_surfer_user_id_users"), "host_requests", type_="foreignkey")
    op.drop_column("host_requests", "host_user_id")
    op.drop_column("host_requests", "surfer_user_id")
