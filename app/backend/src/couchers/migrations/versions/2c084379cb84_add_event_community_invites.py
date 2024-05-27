"""Add event community invites

Revision ID: 2c084379cb84
Revises: ca9d20814704
Create Date: 2024-05-27 15:25:21.916871

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "2c084379cb84"
down_revision = "ca9d20814704"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "event_community_invite_requests",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("occurrence_id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("decided", sa.DateTime(timezone=True), nullable=True),
        sa.Column("decided_by_user_id", sa.BigInteger(), nullable=True),
        sa.Column("approved", sa.Boolean(), nullable=True),
        sa.CheckConstraint(
            "((decided IS NULL) AND (decided_by_user_id IS NULL) AND (approved IS NULL)) OR              ((decided IS NOT NULL) AND (decided_by_user_id IS NOT NULL) AND (approved IS NOT NULL))",
            name=op.f("ck_event_community_invite_requests_decided_approved"),
        ),
        sa.ForeignKeyConstraint(
            ["decided_by_user_id"],
            ["users.id"],
            name=op.f("fk_event_community_invite_requests_decided_by_user_id_users"),
        ),
        sa.ForeignKeyConstraint(
            ["occurrence_id"],
            ["event_occurrences.id"],
            name=op.f("fk_event_community_invite_requests_occurrence_id_event_occurrences"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_event_community_invite_requests_user_id_users")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_event_community_invite_requests")),
        sa.UniqueConstraint("occurrence_id", "user_id", name=op.f("uq_event_community_invite_requests_occurrence_id")),
    )
    op.create_index(
        op.f("ix_event_community_invite_requests_occurrence_id"),
        "event_community_invite_requests",
        ["occurrence_id"],
        unique=False,
    )
    op.create_index(
        "ix_event_community_invite_requests_unique",
        "event_community_invite_requests",
        ["occurrence_id"],
        unique=True,
        postgresql_where=sa.text("approved IS NOT NULL AND approved = true"),
    )
    op.create_index(
        op.f("ix_event_community_invite_requests_user_id"), "event_community_invite_requests", ["user_id"], unique=False
    )
    op.execute("ALTER TYPE notificationtopicaction RENAME VALUE 'event__create' TO 'event__create_any'")
    op.execute("ALTER TYPE notificationtopicaction ADD VALUE 'event__create_approved'")


def downgrade():
    raise Exception("Can't downgrade")
