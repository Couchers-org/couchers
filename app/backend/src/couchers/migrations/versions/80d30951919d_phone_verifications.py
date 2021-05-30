"""Phone verifications

Revision ID: 80d30951919d
Revises: 128252798bc4
Create Date: 2021-05-30 22:13:30.713179

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "80d30951919d"
down_revision = "128252798bc4"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users", sa.Column("phone_verification_attempts", sa.Integer(), server_default=sa.text("0"), nullable=False)
    )
    op.add_column(
        "users",
        sa.Column(
            "phone_verification_sent",
            sa.DateTime(timezone=True),
            server_default=sa.text("to_timestamp(0)"),
            nullable=False,
        ),
    )
    op.add_column(
        "users",
        sa.Column("phone_verification_token", sa.String(length=6), server_default=sa.text("NULL"), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column(
            "phone_verification_verified", sa.DateTime(timezone=True), server_default=sa.text("NULL"), nullable=True
        ),
    )
    op.create_index(
        "ix_users_unique_phone",
        "users",
        ["phone"],
        unique=True,
        postgresql_where=sa.text("phone_verification_verified IS NOT NULL"),
    )
    op.drop_constraint("uq_users_phone", "users", type_="unique")
    op.drop_column("users", "verification")
    op.drop_column("users", "phone_status")
    op.execute("DROP TYPE phonestatus")


def downgrade():
    op.add_column(
        "users",
        sa.Column(
            "phone_status",
            postgresql.ENUM("unverified", "verified", name="phonestatus"),
            autoincrement=False,
            nullable=True,
        ),
    )
    op.add_column(
        "users",
        sa.Column("verification", postgresql.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=True),
    )
    op.create_unique_constraint("uq_users_phone", "users", ["phone"])
    op.drop_index("ix_users_unique_phone", table_name="users")
    op.drop_column("users", "phone_verification_verified")
    op.drop_column("users", "phone_verification_token")
    op.drop_column("users", "phone_verification_sent")
    op.drop_column("users", "phone_verification_attempts")
