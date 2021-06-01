"""add grpc details to api log

Revision ID: 7f23021f7e2b
Revises: 80d30951919d
Create Date: 2021-06-01 11:41:19.843878

"""
from alembic import op
import sqlalchemy as sa
import geoalchemy2


# revision identifiers, used by Alembic.
revision = '7f23021f7e2b'
down_revision = '80d30951919d'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("api_calls",
        sa.Column("details", sa.String(), nullable=True),                                                                               
    )
def downgrade():
    op.drop_column("api_calls", "details")
