"""Fix host request feedback qualities stored under the wrong value

Revision ID: 0209
Revises: 0208
"""

from alembic import op

revision = "0209"
down_revision = "0208"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Until now, no answer was stored as high, low as okay, okay as low, and high as no answer.
    # The swap is its own inverse, so downgrade runs it again.
    op.execute("""
        UPDATE host_request_feedbacks
        SET request_quality = CASE request_quality
            WHEN 'high_quality' THEN NULL
            WHEN 'okay_quality' THEN 'low_quality'::hostrequestquality
            WHEN 'low_quality' THEN 'okay_quality'::hostrequestquality
            ELSE 'high_quality'::hostrequestquality
        END
    """)


def downgrade() -> None:
    upgrade()
