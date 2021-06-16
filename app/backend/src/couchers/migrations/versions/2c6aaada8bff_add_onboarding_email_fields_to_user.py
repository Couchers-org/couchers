"""Add onboarding email fields to user

Revision ID: 2c6aaada8bff
Revises: f4a49acd8801
Create Date: 2021-05-02 12:25:35.640366

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "2c6aaada8bff"
down_revision = "f4a49acd8801"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("last_onboarding_email_sent", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("onboarding_emails_sent", sa.Integer(), server_default="0", nullable=False))
    op.add_column("users", sa.Column("added_to_mailing_list", sa.Boolean(), server_default="false", nullable=False))
    op.execute("ALTER TYPE backgroundjobtype ADD VALUE 'send_onboarding_emails'")
    op.execute("ALTER TYPE backgroundjobtype ADD VALUE 'add_users_to_email_list'")


def downgrade():
    op.drop_column("users", "added_to_mailing_list")
    op.drop_column("users", "onboarding_emails_sent")
    op.drop_column("users", "last_onboarding_email_sent")
