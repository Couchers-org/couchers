"""Add image metadata to uploads

Revision ID: 0188
Revises: 0187
Create Date: 2026-09-07 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0188"
down_revision = "0187"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("uploads", sa.Column("metadata_exif", sa.LargeBinary(), nullable=True))
    op.add_column("uploads", sa.Column("metadata_xmp", sa.LargeBinary(), nullable=True))
    op.add_column("uploads", sa.Column("metadata_iptc", sa.LargeBinary(), nullable=True))
    op.add_column("uploads", sa.Column("metadata_parsed", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("uploads", sa.Column("metadata_parse_error", sa.String(), nullable=True))
    op.add_column("uploads", sa.Column("original_filename", sa.String(), nullable=True))
    op.add_column("uploads", sa.Column("original_format", sa.String(), nullable=True))
    op.add_column("uploads", sa.Column("original_size", sa.BigInteger(), nullable=True))
    op.add_column("uploads", sa.Column("original_width", sa.Integer(), nullable=True))
    op.add_column("uploads", sa.Column("original_height", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("uploads", "original_height")
    op.drop_column("uploads", "original_width")
    op.drop_column("uploads", "original_size")
    op.drop_column("uploads", "original_format")
    op.drop_column("uploads", "original_filename")
    op.drop_column("uploads", "metadata_parse_error")
    op.drop_column("uploads", "metadata_parsed")
    op.drop_column("uploads", "metadata_iptc")
    op.drop_column("uploads", "metadata_xmp")
    op.drop_column("uploads", "metadata_exif")
