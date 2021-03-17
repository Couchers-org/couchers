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
    op.execute(
        """
    CREATE TYPE referencetype_new AS ENUM ('friend', 'surfed', 'hosted');
    ALTER TABLE "references" ALTER COLUMN reference_type TYPE referencetype_new USING (LOWER(reference_type::text)::referencetype_new);
    DROP TYPE referencetype;
    ALTER TYPE referencetype_new RENAME TO referencetype;
    """
    )
    op.create_index(
        "ix_references_from_user_id_to_user_id_reference_type",
        "references",
        ["from_user_id", "to_user_id", "reference_type"],
        unique=True,
        postgresql_where=sa.text("reference_type = 'friend'"),
    )


def downgrade():
    op.drop_index("ix_references_from_user_id_to_user_id_reference_type", table_name="references")
    op.execute(
        """
    CREATE TYPE referencetype_old AS ENUM ('FRIEND', 'SURFED', 'HOSTED');
    ALTER TABLE "references" ALTER COLUMN reference_type TYPE referencetype_old USING (UPPER(reference_type::text)::referencetype_old);
    DROP TYPE referencetype;
    ALTER TYPE referencetype_old RENAME TO referencetype;
    """
    )
    op.create_unique_constraint(
        "uq_references_from_user_id", "references", ["from_user_id", "to_user_id", "reference_type"]
    )
