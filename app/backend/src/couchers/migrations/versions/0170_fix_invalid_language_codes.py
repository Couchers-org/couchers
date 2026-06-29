"""Fix invalid/deprecated ISO 639-3 language codes

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
    # Reload languages table (removes _tw, ajp, smi from the static table)
    copy_resources_to_database(session)
    # _tw ("Taiwanese") is an invented code; official equivalent is nan ("Chinese (Southern Min)")
    # Dedupe first: drop _tw for users who already have nan
    op.execute(
        "DELETE FROM language_abilities WHERE language_code='_tw' AND user_id IN "
        "(SELECT user_id FROM language_abilities WHERE language_code='nan');"
    )
    op.execute("UPDATE language_abilities SET language_code='nan' WHERE language_code='_tw';")
    # ajp ("Arabic (Levantine South)") is deprecated; ISO merged it into apc ("Arabic (Levantine North)")
    # Dedupe first: drop ajp for users who already have apc
    op.execute(
        "DELETE FROM language_abilities WHERE language_code='ajp' AND user_id IN "
        "(SELECT user_id FROM language_abilities WHERE language_code='apc');"
    )
    op.execute("UPDATE language_abilities SET language_code='apc' WHERE language_code='ajp';")
    # smi ("Sámi") is an ISO 639-2 group code with no individual equivalent; drop it
    op.execute("DELETE FROM language_abilities WHERE language_code='smi';")
    session.commit()


def downgrade() -> None:
    pass
