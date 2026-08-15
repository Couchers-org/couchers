"""Add hosting_meetup_status_history table

Revision ID: 0182
Revises: 0181
Create Date: 2026-08-15 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0182"
down_revision = "0181"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "hosting_meetup_status_history",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("time", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "source",
            sa.Enum(
                "signup",
                "profile_edit",
                "do_not_email",
                "unsubscribe_link",
                "activeness_probe_response",
                "activeness_probe_expired",
                name="hostingmeetupstatussource",
            ),
            nullable=False,
        ),
        sa.Column(
            "hosting_status",
            postgresql.ENUM("can_host", "maybe", "cant_host", name="hostingstatus", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "meetup_status",
            postgresql.ENUM(
                "wants_to_meetup", "open_to_meetup", "does_not_want_to_meetup", name="meetupstatus", create_type=False
            ),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_hosting_meetup_status_history_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_hosting_meetup_status_history")),
    )
    op.create_index(
        "ix_hosting_meetup_status_history_user_id_time", "hosting_meetup_status_history", ["user_id", "time"]
    )


def downgrade() -> None:
    op.drop_table("hosting_meetup_status_history")
    sa.Enum(name="hostingmeetupstatussource").drop(op.get_bind(), checkfirst=True)
