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
    # op.drop_constraint("uq_references_from_user_id", "references", type_="unique")
    op.execute(
        """
    CREATE TYPE referencetype_new AS ENUM ('friend', 'surfed', 'hosted');
    ALTER TABLE "references" ALTER COLUMN reference_type TYPE referencetype_new USING (LOWER(reference_type::text)::referencetype_new);
    DROP TYPE referencetype;
    ALTER TYPE referencetype_new RENAME TO referencetype;
    """
    )
    op.add_column("references", sa.Column("host_request_id", sa.BigInteger(), nullable=True))
    op.create_foreign_key(
        op.f("fk_references_host_request_id_host_requests"), "references", "host_requests", ["host_request_id"], ["id"]
    )
    op.create_index(
        "ix_references_unique_per_host_request",
        "references",
        ["from_user_id", "to_user_id", "host_request_id"],
        unique=True,
        postgresql_where=sa.text("host_request_id IS NOT NULL"),
    )
    op.create_check_constraint(
        "ck_references_host_request_id_xor_friend_reference",
        "references",
        "(host_request_id IS NULL AND reference_type = 'friend') OR (host_request_id IS NOT NULL AND reference_type != 'friend')",
    )
    op.execute('ALTER TABLE "references" ALTER COLUMN rating TYPE double precision USING rating::double precision / 10')
    op.create_check_constraint(
        "ck_references_rating_between_0_and_1",
        "references",
        "rating BETWEEN 0 AND 1",
    )
    op.create_index(
        "ix_references_unique_friend_reference",
        "references",
        ["from_user_id", "to_user_id", "reference_type"],
        unique=True,
        postgresql_where=sa.text("reference_type = 'friend'"),
    )
    op.execute('ALTER TABLE "references" RENAME COLUMN was_safe TO was_appropriate')


def downgrade():
    op.execute('ALTER TABLE "references" RENAME COLUMN was_appropriate TO was_safe')
    op.drop_index("ix_references_unique_friend_reference", table_name="references")
    op.drop_constraint("ck_references_rating_between_0_and_1")
    op.execute('ALTER TABLE "references" ALTER COLUMN rating TYPE int USING round(rating * 10)')
    op.drop_constraint("ck_references_host_request_id_xor_friend_reference")
    op.drop_index("ix_references_unique_per_host_request", table_name="references")
    op.drop_constraint(op.f("fk_references_host_request_id_host_requests"), "references", type_="foreignkey")
    op.drop_column("references", "host_request_id")
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
