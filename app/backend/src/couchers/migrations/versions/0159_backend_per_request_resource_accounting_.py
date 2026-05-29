"""Backend: Per-request resource accounting on api_calls

Revision ID: 0159
Revises: 0158
Create Date: 2026-05-28 23:58:35.420486

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0159"
down_revision = "0158"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("api_calls", sa.Column("db_query_count", sa.BigInteger(), nullable=True), schema="logging")
    op.add_column("api_calls", sa.Column("db_write_query_count", sa.BigInteger(), nullable=True), schema="logging")
    op.add_column("api_calls", sa.Column("db_time_ms", sa.Float(), nullable=True), schema="logging")
    op.add_column("api_calls", sa.Column("cpu_ms", sa.Float(), nullable=True), schema="logging")
    op.add_column(
        "api_calls",
        sa.Column(
            "client_platform",
            sa.Enum("web_desktop", "web_mobile", "app_ios", "app_android", name="clientplatform"),
            nullable=True,
        ),
        schema="logging",
    )


def downgrade() -> None:
    op.drop_column("api_calls", "client_platform", schema="logging")
    op.drop_column("api_calls", "cpu_ms", schema="logging")
    op.drop_column("api_calls", "db_time_ms", schema="logging")
    op.drop_column("api_calls", "db_write_query_count", schema="logging")
    op.drop_column("api_calls", "db_query_count", schema="logging")
