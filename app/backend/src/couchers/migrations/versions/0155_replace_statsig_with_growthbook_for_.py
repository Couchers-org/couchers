"""Replace Statsig with GrowthBook for experimentation

Revision ID: 0155
Revises: 0154
Create Date: 2026-05-15 03:18:53.799426

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0155"
down_revision = "0154"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "experiment_exposures",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("version", sa.String(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("experiment_key", sa.String(), nullable=False),
        sa.Column("variation_id", sa.BigInteger(), nullable=False),
        sa.Column("data", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_experiment_exposures")),
        sa.UniqueConstraint("user_id", "experiment_key", "variation_id", name="uq_experiment_exposures_user_exp_var"),
        schema="logging",
    )
    op.create_index(
        "ix_logging_experiment_exposures_experiment_key_created",
        "experiment_exposures",
        ["experiment_key", "created"],
        unique=False,
        schema="logging",
    )
    op.create_index(
        "ix_logging_experiment_exposures_user_id_created",
        "experiment_exposures",
        ["user_id", "created"],
        unique=False,
        schema="logging",
    )


def downgrade() -> None:
    op.drop_index(
        "ix_logging_experiment_exposures_user_id_created", table_name="experiment_exposures", schema="logging"
    )
    op.drop_index(
        "ix_logging_experiment_exposures_experiment_key_created", table_name="experiment_exposures", schema="logging"
    )
    op.drop_table("experiment_exposures", schema="logging")
