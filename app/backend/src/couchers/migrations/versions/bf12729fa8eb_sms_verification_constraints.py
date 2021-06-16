"""Add phone verification constraints

Revision ID: bf12729fa8eb
Revises: d3cee8207c3d
Create Date: 2021-06-14 09:10:35.309227

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "bf12729fa8eb"
down_revision = "d3cee8207c3d"
branch_labels = None
depends_on = None


def upgrade():
    op.create_check_constraint(
        "phone_verified_conditions",
        "users",
        "((((((phone IS NULL))::integer + ((phone_verification_verified IS NOT NULL))::integer) + ((phone_verification_token IS NOT NULL))::integer) = 1))",
    )


def downgrade():
    raise hell
