"""Record a history of users' email addresses

Revision ID: 0192
Revises: 0191
Create Date: 2026-09-27 18:10:57.792407

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0192"
down_revision = "0191"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_email_history",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("time", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_user_email_history_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_user_email_history")),
    )
    op.create_index("ix_user_email_history_email", "user_email_history", ["email"], unique=False)
    op.create_index("ix_user_email_history_user_id_time", "user_email_history", ["user_id", "time"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_user_email_history_user_id_time", table_name="user_email_history")
    op.drop_index("ix_user_email_history_email", table_name="user_email_history")
    op.drop_table("user_email_history")
