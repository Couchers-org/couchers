"""Add onboarding email fields to user

Revision ID: 2c6aaada8bff
Revises: 2d656b6ad999
Create Date: 2021-05-02 12:25:35.640366

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "2c6aaada8bff"
down_revision = "2d656b6ad999"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("last_onboarding_email_sent", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("onboarding_emails_sent", sa.Integer(), server_default="0", nullable=False))
    op.execute("ALTER TYPE backgroundjobtype ADD VALUE 'send_onboarding_emails'")


def downgrade():
    op.drop_column("users", "onboarding_emails_sent")
    op.drop_column("users", "last_onboarding_email_sent")
