"""add indexes to user1 and user2 in userlink table

Revision ID: 73e755de1639
Revises: c583139c42f4
Create Date: 2025-05-08 11:16:30.648779

"""

from alembic import op

revision = "73e755de1639"
down_revision = "c583139c42f4"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index(op.f("ix_user_links_user1_id"), "user_links", ["user1_id"], unique=False)
    op.create_index(op.f("ix_user_links_user2_id"), "user_links", ["user2_id"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_user_links_user2_id"), table_name="user_links")
    op.drop_index(op.f("ix_user_links_user1_id"), table_name="user_links")
