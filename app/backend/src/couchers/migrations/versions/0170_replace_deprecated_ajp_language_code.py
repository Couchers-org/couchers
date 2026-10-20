"""Replace deprecated ajp language code with apc

Revision ID: 0170
Revises: 0169
Create Date: 2026-06-29 00:00:00.000000

"""

from alembic import op
from sqlalchemy.orm.session import Session

from couchers.resources import copy_resources_to_database

# revision identifiers, used by Alembic.
revision = "0170"
down_revision = "0169"
branch_labels = None
depends_on = None


def upgrade() -> None:
    session = Session(bind=op.get_bind())
    copy_resources_to_database(session)
    # ajp (South Levantine Arabic) was retired in ISO 639-3 CR 2022-006 and merged into apc.
    # Dedupe before the rename: UniqueConstraint(user_id, language_code) is NOT deferrable.
    op.execute(
        "DELETE FROM language_abilities WHERE language_code='ajp' AND user_id IN "
        "(SELECT user_id FROM language_abilities WHERE language_code='apc');"
    )
    op.execute("UPDATE language_abilities SET language_code='apc' WHERE language_code='ajp';")
    session.commit()


def downgrade() -> None:
    # Irreversible: the dedupe DELETE can drop a row's fluency, and the static languages table
    # is not re-synced to its pre-migration contents (consistent with migration 0027).
    pass
