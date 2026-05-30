"""Log feature flag usage per user

Revision ID: 0157
Revises: 0156
Create Date: 2026-05-23 05:13:52.193316

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0157"
down_revision = "0156"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "feature_usage",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("time", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("feature_key", sa.String(), nullable=False),
        sa.Column("value", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_feature_usage")),
        schema="logging",
    )
    op.create_index(
        "ix_logging_feature_usage_feature_key_time",
        "feature_usage",
        ["feature_key", "time"],
        unique=False,
        schema="logging",
    )
    op.create_index(
        "ix_logging_feature_usage_user_id_time", "feature_usage", ["user_id", "time"], unique=False, schema="logging"
    )


def downgrade() -> None:
    op.drop_index("ix_logging_feature_usage_user_id_time", table_name="feature_usage", schema="logging")
    op.drop_index("ix_logging_feature_usage_feature_key_time", table_name="feature_usage", schema="logging")
    op.drop_table("feature_usage", schema="logging")
