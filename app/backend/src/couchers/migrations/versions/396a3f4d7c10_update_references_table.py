"""Update references table

Revision ID: 396a3f4d7c10
Revises: fab13aac7ea2
Create Date: 2021-03-17 15:17:08.926784

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "396a3f4d7c10"
down_revision = "fab13aac7ea2"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_constraint("uq_references_from_user_id", "references", type_="unique")
    op.create_index(
        "ix_references_from_user_id",
        "references",
        ["from_user_id", "to_user_id", "reference_type"],
        unique=True,
        postgresql_where=sa.text("reference_type = 'friend'"),
    )


def downgrade():
    op.drop_index("ix_references_from_user_id", table_name="references")
    op.create_unique_constraint(
        "uq_references_from_user_id", "references", ["from_user_id", "to_user_id", "reference_type"]
    )
