"""Modify the database

Revision ID: 152a14ce8d96
Revises: cce0606c2f41
Create Date: 2021-01-20 22:37:09.380536

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "152a14ce8d96"
down_revision = "cce0606c2f41"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("comments", sa.Column("author_user_id", sa.BigInteger(), nullable=False))
    op.create_foreign_key(op.f("fk_comments_author_user_id_users"), "comments", "users", ["author_user_id"], ["id"])
    op.drop_index("ix_discussions_thread_id", table_name="discussions")
    op.create_index(op.f("ix_discussions_thread_id"), "discussions", ["thread_id"], unique=True)
    op.drop_index("ix_events_thread_id", table_name="events")
    op.create_index(op.f("ix_events_thread_id"), "events", ["thread_id"], unique=True)
    op.add_column("replies", sa.Column("author_user_id", sa.BigInteger(), nullable=False))
    op.create_foreign_key(op.f("fk_replies_author_user_id_users"), "replies", "users", ["author_user_id"], ["id"])


def downgrade():
    op.drop_constraint(op.f("fk_replies_author_user_id_users"), "replies", type_="foreignkey")
    op.drop_column("replies", "author_user_id")
    op.drop_index(op.f("ix_events_thread_id"), table_name="events")
    op.create_index("ix_events_thread_id", "events", ["thread_id"], unique=False)
    op.drop_index(op.f("ix_discussions_thread_id"), table_name="discussions")
    op.create_index("ix_discussions_thread_id", "discussions", ["thread_id"], unique=False)
    op.drop_constraint(op.f("fk_comments_author_user_id_users"), "comments", type_="foreignkey")
    op.drop_column("comments", "author_user_id")
