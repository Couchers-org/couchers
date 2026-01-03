"""Add host req feedback

Revision ID: f7fa767c2999
Revises: c29307a66e4b
Create Date: 2025-07-27 18:06:24.059573

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "f7fa767c2999"
down_revision = "c29307a66e4b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "host_request_feedbacks",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("time", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("host_request_id", sa.BigInteger(), nullable=False),
        sa.Column("from_user_id", sa.BigInteger(), nullable=False),
        sa.Column("to_user_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "request_quality",
            sa.Enum("high_quality", "okay_quality", "low_quality", name="hostrequestquality"),
            nullable=True,
        ),
        sa.Column("decline_reason", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(
            ["from_user_id"], ["users.id"], name=op.f("fk_host_request_feedbacks_from_user_id_users")
        ),
        sa.ForeignKeyConstraint(
            ["host_request_id"],
            ["host_requests.id"],
            name=op.f("fk_host_request_feedbacks_host_request_id_host_requests"),
        ),
        sa.ForeignKeyConstraint(["to_user_id"], ["users.id"], name=op.f("fk_host_request_feedbacks_to_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_host_request_feedbacks")),
    )
    op.create_index(
        op.f("ix_host_request_feedbacks_from_user_id"), "host_request_feedbacks", ["from_user_id"], unique=False
    )
    op.create_index(
        op.f("ix_host_request_feedbacks_to_user_id"), "host_request_feedbacks", ["to_user_id"], unique=False
    )
    op.create_index(
        "ix_unique_host_req_feedback",
        "host_request_feedbacks",
        ["from_user_id", "to_user_id", "host_request_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_unique_host_req_feedback", table_name="host_request_feedbacks")
    op.drop_index(op.f("ix_host_request_feedbacks_to_user_id"), table_name="host_request_feedbacks")
    op.drop_index(op.f("ix_host_request_feedbacks_from_user_id"), table_name="host_request_feedbacks")
    op.drop_table("host_request_feedbacks")
