"""Add private text to references

Revision ID: 0032
Revises: 0031
Create Date: 2022-01-07 18:41:14.274448

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0032"
down_revision = "0031"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("references", sa.Column("private_text", sa.String(), nullable=True))
    op.alter_column("references", "text", existing_type=sa.VARCHAR(), nullable=False)
    op.execute(r"""UPDATE "references" SET text = regexp_replace(regexp_replace(text, '^\s+', ''), '\s+$', '')""")


def downgrade() -> None:
    op.alter_column("references", "text", existing_type=sa.VARCHAR(), nullable=True)
    op.drop_column("references", "private_text")
