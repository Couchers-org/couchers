"""Add call traces

Revision ID: a3700d2af277
Revises: c035cdcabd40
Create Date: 2021-05-11 17:02:13.021133

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a3700d2af277"
down_revision = "c035cdcabd40"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "api_calls",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("version", sa.String(), nullable=False),
        sa.Column("time", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("method", sa.String(), nullable=False),
        sa.Column("status_code", sa.String(), nullable=True),
        sa.Column("duration", sa.Float(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=True),
        sa.Column("request", sa.LargeBinary(), nullable=True),
        sa.Column("response", sa.LargeBinary(), nullable=True),
        sa.Column("traceback", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_api_calls")),
    )


def downgrade():
    op.drop_table("api_calls")
