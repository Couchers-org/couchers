"""Implement signup flow v2

Revision ID: 9b200d8acd3c
Revises: 80d30951919d
Create Date: 2021-06-01 10:42:47.550115

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "9b200d8acd3c"
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
        sa.Column("contribute_ways", sa.ARRAY(sa.String()), nullable=True),
        sa.Column("expertise", sa.String(), nullable=True),
        sa.CheckConstraint(
            "filled_account <> ((username IS NULL) AND (birthdate IS NULL) AND (gender IS NULL) AND (hosting_status IS NULL) AND (city IS NULL) AND (geom IS NULL) AND (geom_radius IS NULL) AND (accepted_tos IS NULL))",
            name=op.f("ck_signup_flows_account_required"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_signup_flows")),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("email", name=op.f("uq_signup_flows_email")),
        sa.UniqueConstraint("flow_token"),
        sa.UniqueConstraint("flow_token", name=op.f("uq_signup_flows_flow_token")),
        sa.UniqueConstraint("username"),
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
    op.execute(
        """
    CREATE TYPE backgroundjobtype_new AS ENUM ('send_email', 'purge_login_tokens', 'send_message_notifications', 'send_onboarding_emails', 'add_users_to_email_list', 'send_request_notifications');
    DELETE FROM background_jobs WHERE job_type = 'purge_signup_tokens';
    ALTER TABLE background_jobs ALTER COLUMN job_type TYPE backgroundjobtype_new USING (LOWER(job_type::text)::backgroundjobtype_new);
    DROP TYPE backgroundjobtype;
    ALTER TYPE backgroundjobtype_new RENAME TO backgroundjobtype;
    """
    )


def downgrade():
    raise Exception("Can't downgrade")
