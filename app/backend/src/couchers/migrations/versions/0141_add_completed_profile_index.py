"""Add index for completed profile queries

Revision ID: 0141
Revises: 0140
Create Date: 2026-03-29 22:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0141"
down_revision = "0140"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE INDEX ix_users_completed_profile ON users (id)
        WHERE banned_at IS NULL
          AND deleted_at IS NULL
          AND profile_gallery_id IS NOT NULL
          AND COALESCE(character_length((about_me)::text), 0) >= 150;
    """)


def downgrade() -> None:
    op.drop_index("ix_users_completed_profile")
