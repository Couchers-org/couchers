"""Add activeness probes

Revision ID: ff3ee8951d1b
Revises: 20842baa0c53
Create Date: 2025-03-02 12:16:18.782722

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "ff3ee8951d1b"
down_revision = "20842baa0c53"
branch_labels = None
depends_on = None


def upgrade():
    # remove postgis things we don't use
    op.execute("DROP EXTENSION IF EXISTS postgis_tiger_geocoder")

    op.create_table(
        "activeness_probes",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("probe_initiated", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("notifications_sent", sa.Integer(), server_default="0", nullable=False),
        sa.Column("responded", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "response",
            sa.Enum("pending", "expired", "still_active", "no_longer_active", name="activenessprobestatus"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "(responded IS NULL AND response = 'pending') OR (responded IS NOT NULL AND response != 'pending')",
            name=op.f("ck_activeness_probes_pending_has_no_responded"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_activeness_probes_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_activeness_probes")),
    )
    op.create_index(
        "ix_activeness_probe_unique_pending_response",
        "activeness_probes",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("responded IS NULL"),
    )
    op.create_index(op.f("ix_activeness_probes_user_id"), "activeness_probes", ["user_id"], unique=False)

    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'activeness__probe'")
