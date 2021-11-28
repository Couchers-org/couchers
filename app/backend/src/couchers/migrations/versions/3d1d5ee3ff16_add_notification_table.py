"""Add notification table

Revision ID: 3d1d5ee3ff16
Revises: 1c809d111871
Create Date: 2021-10-10 11:53:47.846732

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "3d1d5ee3ff16"
down_revision = "1c809d111871"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "notifications",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("priority", sa.Enum("immediate", "normal", "low", name="notificationpriority"), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("topic", sa.String(), nullable=False),
        sa.Column("key", sa.String(), nullable=False),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("avatar_key", sa.String(), nullable=True),
        sa.Column("icon", sa.String(), nullable=True),
        sa.Column("title", sa.String(), nullable=True),
        sa.Column("content", sa.String(), nullable=True),
        sa.Column("link", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_notifications_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_notifications")),
    )
    op.execute("ALTER TYPE backgroundjobtype ADD VALUE 'handle_notification'")


def downgrade():
    op.drop_table("notifications")
