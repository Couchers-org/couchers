"""Unique active friend relationship per user pair

Revision ID: 0146
Revises: 0145
Create Date: 2026-04-24 00:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0146"
down_revision = "0145"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # For each unordered user pair with more than one active (pending/accepted)
    # friend_relationship, cancel all but the latest (highest id) row.
    op.execute("""
        UPDATE friend_relationships
        SET status = 'cancelled', time_responded = now()
        WHERE id IN (
            SELECT id FROM (
                SELECT id,
                       row_number() OVER (
                           PARTITION BY least(from_user_id, to_user_id),
                                        greatest(from_user_id, to_user_id)
                           ORDER BY id DESC
                       ) AS rn
                FROM friend_relationships
                WHERE status IN ('pending', 'accepted')
            ) ranked
            WHERE rn > 1
        )
    """)
    op.execute("""
        CREATE UNIQUE INDEX uq_friend_relationships_active_pair
        ON friend_relationships (least(from_user_id, to_user_id), greatest(from_user_id, to_user_id))
        WHERE status IN ('pending', 'accepted')
    """)


def downgrade() -> None:
    op.drop_index("uq_friend_relationships_active_pair", table_name="friend_relationships")
