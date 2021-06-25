"""Implement signup flow v2

Revision ID: 62fcd41e4dcd
Revises: 5e89dd9ef181
Create Date: 2021-06-25 08:17:24.410658

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "62fcd41e4dcd"
down_revision = "5e89dd9ef181"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "signup_flows",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("flow_token", sa.String(), nullable=False),
        sa.Column("email_verified", sa.Boolean(), nullable=False),
        sa.Column("email_sent", sa.Boolean(), nullable=False),
        sa.Column("email_token", sa.String(), nullable=True),
        sa.Column("email_token_expiry", sa.DateTime(timezone=True), nullable=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("username", sa.String(), nullable=True),
        sa.Column("hashed_password", sa.LargeBinary(), nullable=True),
        sa.Column("birthdate", sa.Date(), nullable=True),
        sa.Column("gender", sa.String(), nullable=True),
        sa.Column("hosting_status", sa.Enum("can_host", "maybe", "cant_host", name="hostingstatus"), nullable=True),
        sa.Column("city", sa.String(), nullable=True),
        sa.Column(
            "geom",
            geoalchemy2.types.Geometry(geometry_type="POINT", srid=4326, from_text="ST_GeomFromEWKT", name="geometry"),
            nullable=True,
        ),
        sa.Column("geom_radius", sa.Float(), nullable=True),
        sa.Column("accepted_tos", sa.Integer(), nullable=True),
        sa.Column("filled_feedback", sa.Boolean(), nullable=False),
        sa.Column("ideas", sa.String(), nullable=True),
        sa.Column("features", sa.String(), nullable=True),
        sa.Column("experience", sa.String(), nullable=True),
        sa.Column("contribute", sa.Enum("yes", "maybe", "no", name="contributeoption"), nullable=True),
        sa.Column("contribute_ways", sa.ARRAY(sa.String()), nullable=True),
        sa.Column("expertise", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_signup_flows")),
        sa.UniqueConstraint("email", name=op.f("uq_signup_flows_email")),
        sa.UniqueConstraint("flow_token", name=op.f("uq_signup_flows_flow_token")),
        sa.UniqueConstraint("username", name=op.f("uq_signup_flows_username")),
    )
    op.create_table(
        "contributor_forms",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("ideas", sa.String(), nullable=True),
        sa.Column("features", sa.String(), nullable=True),
        sa.Column("experience", sa.String(), nullable=True),
        sa.Column("contribute", sa.Enum("yes", "maybe", "no", name="contributeoption"), nullable=True),
        sa.Column("contribute_ways", sa.ARRAY(sa.String()), nullable=True),
        sa.Column("expertise", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_contributor_forms_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_contributor_forms")),
    )
    op.create_index(op.f("ix_contributor_forms_user_id"), "contributor_forms", ["user_id"], unique=False)
    op.drop_table("signup_tokens")


def downgrade():
    op.create_table(
        "signup_tokens",
        sa.Column("token", sa.VARCHAR(), autoincrement=False, nullable=False),
        sa.Column("email", sa.VARCHAR(), autoincrement=False, nullable=False),
        sa.Column(
            "created",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            autoincrement=False,
            nullable=False,
        ),
        sa.Column("expiry", postgresql.TIMESTAMP(timezone=True), autoincrement=False, nullable=False),
        sa.PrimaryKeyConstraint("token", name="pk_signup_tokens"),
    )
    op.drop_index(op.f("ix_contributor_forms_user_id"), table_name="contributor_forms")
    op.drop_table("contributor_forms")
    op.drop_table("signup_flows")
