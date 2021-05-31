"""Add new signup flow tables

Revision ID: 6ca6f7db36d7
Revises: 80d30951919d
Create Date: 2021-05-30 15:34:27.613245

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "6ca6f7db36d7"
down_revision = "80d30951919d"
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
        sa.Column("email_token_created", sa.DateTime(timezone=True), nullable=True),
        sa.Column("email_token_expiry", sa.DateTime(timezone=True), nullable=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("filled_account", sa.Boolean(), nullable=False),
        sa.Column("username", sa.String(), nullable=True),
        sa.Column("hashed_password", sa.LargeBinary(), nullable=True),
        sa.Column("birthdate", sa.Date(), nullable=True),
        sa.Column("gender", sa.String(), nullable=True),
        sa.Column(
            "hosting_status",
            postgresql.ENUM("can_host", "maybe", "cant_host", name="hostingstatus", create_type=False),
            nullable=True,
        ),
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
        sa.Column("contribute_ways", sa.String(), nullable=True),
        sa.Column("expertise", sa.String(), nullable=True),
        sa.CheckConstraint(
            "filled_account <> (accepted_tos IS NULL)", name=op.f("ck_signup_flows_accepted_tos_required")
        ),
        sa.CheckConstraint("filled_account <> (birthdate IS NULL)", name=op.f("ck_signup_flows_birthdate_required")),
        sa.CheckConstraint("filled_account <> (city IS NULL)", name=op.f("ck_signup_flows_city_required")),
        sa.CheckConstraint("filled_account <> (gender IS NULL)", name=op.f("ck_signup_flows_gender_required")),
        sa.CheckConstraint("filled_account <> (geom IS NULL)", name=op.f("ck_signup_flows_geom_required")),
        sa.CheckConstraint(
            "filled_account <> (geom_radius IS NULL)", name=op.f("ck_signup_flows_geom_radius_required")
        ),
        sa.CheckConstraint(
            "filled_account <> (hosting_status IS NULL)", name=op.f("ck_signup_flows_hosting_status_required")
        ),
        sa.CheckConstraint("filled_account <> (username IS NULL)", name=op.f("ck_signup_flows_username_required")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_signup_flows")),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("email", name=op.f("uq_signup_flows_email")),
        sa.UniqueConstraint("flow_token"),
        sa.UniqueConstraint("flow_token", name=op.f("uq_signup_flows_flow_token")),
        sa.UniqueConstraint("username"),
        sa.UniqueConstraint("username", name=op.f("uq_signup_flows_username")),
    )
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
    op.drop_table("signup_flows")
