"""Backend/feature: Add dismissable dashboard reminders

Revision ID: 0149
Revises: 0148
Create Date: 2026-05-10 02:06:58.881909

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0149"
down_revision = "0148"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "reminder_dismissals",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "reminder_type",
            sa.Enum(
                "complete_profile",
                "complete_verification",
                "respond_to_host_request",
                "write_reference",
                name="remindertype",
            ),
            nullable=False,
        ),
        sa.Column("host_request_id", sa.BigInteger(), nullable=True),
        sa.Column("dismissed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "(reminder_type IN ('complete_profile', 'complete_verification') AND host_request_id IS NULL) OR (reminder_type IN ('respond_to_host_request', 'write_reference') AND host_request_id IS NOT NULL)",
            name=op.f("ck_reminder_dismissals_entity_consistency"),
        ),
        sa.ForeignKeyConstraint(
            ["host_request_id"], ["host_requests.id"], name=op.f("fk_reminder_dismissals_host_request_id_host_requests")
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_reminder_dismissals_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_reminder_dismissals")),
    )
    op.create_index(
        "ix_reminder_dismissals_entity_unique",
        "reminder_dismissals",
        ["user_id", "reminder_type", "host_request_id"],
        unique=True,
        postgresql_where=sa.text("host_request_id IS NOT NULL"),
    )
    op.create_index(
        "ix_reminder_dismissals_global_unique",
        "reminder_dismissals",
        ["user_id", "reminder_type"],
        unique=True,
        postgresql_where=sa.text("host_request_id IS NULL"),
    )
    op.create_index(
        "ix_reminder_dismissals_user_type", "reminder_dismissals", ["user_id", "reminder_type"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_reminder_dismissals_user_type", table_name="reminder_dismissals")
    op.drop_index(
        "ix_reminder_dismissals_global_unique",
        table_name="reminder_dismissals",
        postgresql_where=sa.text("host_request_id IS NULL"),
    )
    op.drop_index(
        "ix_reminder_dismissals_entity_unique",
        table_name="reminder_dismissals",
        postgresql_where=sa.text("host_request_id IS NOT NULL"),
    )
    op.drop_table("reminder_dismissals")
