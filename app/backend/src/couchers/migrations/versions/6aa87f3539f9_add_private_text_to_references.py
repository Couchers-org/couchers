"""Add private text to references

Revision ID: 6aa87f3539f9
Revises: 1c809d111871
Create Date: 2022-01-07 18:41:14.274448

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "6aa87f3539f9"
down_revision = "1c809d111871"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("references", sa.Column("private_text", sa.String(), nullable=True))
    op.alter_column("references", "text", existing_type=sa.VARCHAR(), nullable=False)
    op.execute("UPDATE \"references\" SET text = regexp_replace(regexp_replace(text, '^\s+', ''), '\s+$', '')")


def downgrade():
    op.alter_column("references", "text", existing_type=sa.VARCHAR(), nullable=True)
    op.drop_column("references", "private_text")
