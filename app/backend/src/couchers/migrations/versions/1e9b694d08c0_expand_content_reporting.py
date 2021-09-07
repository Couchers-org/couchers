"""Expand content reporting

Revision ID: 1e9b694d08c0
Revises: 74e7f371be76
Create Date: 2021-08-15 18:06:39.723707

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "1e9b694d08c0"
down_revision = "74e7f371be76"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "content_reports",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("time", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("reporting_user_id", sa.BigInteger(), nullable=False),
        sa.Column("reason", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=False),
        sa.Column("content_ref", sa.String(), nullable=False),
        sa.Column("author_user_id", sa.BigInteger(), nullable=False),
        sa.Column("user_agent", sa.String(), nullable=False),
        sa.Column("page", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["author_user_id"], ["users.id"], name=op.f("fk_content_reports_author_user_id_users")),
        sa.ForeignKeyConstraint(
            ["reporting_user_id"], ["users.id"], name=op.f("fk_content_reports_reporting_user_id_users")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_content_reports")),
    )
    op.create_index(
        op.f("ix_content_reports_reporting_user_id"), "content_reports", ["reporting_user_id"], unique=False
    )
    op.execute(
        """
    INSERT INTO content_reports (time, reporting_user_id, reason, description, content_ref, author_user_id, user_agent, page)
    SELECT time, author_user_id, reason, description, 'profile/' || reported_user_id, reported_user_id, '', ''
    FROM complaints;
    """
    )
    op.drop_table("complaints")


def downgrade():
    op.create_table(
        "complaints",
        sa.Column("id", sa.BIGINT(), autoincrement=True, nullable=False),
        sa.Column(
            "time",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            autoincrement=False,
            nullable=False,
        ),
        sa.Column("author_user_id", sa.BIGINT(), autoincrement=False, nullable=False),
        sa.Column("reported_user_id", sa.BIGINT(), autoincrement=False, nullable=False),
        sa.Column("reason", sa.VARCHAR(), autoincrement=False, nullable=False),
        sa.Column("description", sa.VARCHAR(), autoincrement=False, nullable=False),
        sa.ForeignKeyConstraint(["author_user_id"], ["users.id"], name="fk_complaints_author_user_id_users"),
        sa.ForeignKeyConstraint(["reported_user_id"], ["users.id"], name="fk_complaints_reported_user_id_users"),
        sa.PrimaryKeyConstraint("id", name="pk_complaints"),
    )
    op.create_index("ix_complaints_reported_user_id", "complaints", ["reported_user_id"], unique=False)
    op.create_index("ix_complaints_author_user_id", "complaints", ["author_user_id"], unique=False)
    op.drop_table("content_reports")
