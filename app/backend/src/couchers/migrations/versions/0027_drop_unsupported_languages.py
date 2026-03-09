"""Drop unsupported languages

Revision ID: 0027
Revises: 0026
Create Date: 2021-07-23 14:24:10.552662

"""

from alembic import op
from sqlalchemy.orm.session import Session

from couchers.resources import copy_resources_to_database

# revision identifiers, used by Alembic.
revision = "0027"
down_revision = "0026"
branch_labels = None
depends_on = None


def upgrade() -> None:
    session = Session(bind=op.get_bind())
    copy_resources_to_database(session)
    op.execute("UPDATE language_abilities SET language_code = 'arb' WHERE language_code = 'ara';")
    op.execute("UPDATE language_abilities SET language_code = 'cmn' WHERE language_code = 'zho';")
    op.execute(
        "DELETE FROM language_abilities WHERE language_code in ('ara', 'arg', 'ave', 'bis', 'bre', 'cha', 'cor', 'cos', 'cre', 'div', 'dzo', 'fao', 'fij', 'gla', 'gle', 'glv', 'her', 'hmo', 'ido', 'iku', 'ipk', 'kua', 'mah', 'mri', 'nau', 'nav', 'oci', 'oji', 'pli', 'roh', 'sag', 'san', 'sme', 'tah', 'ton', 'vol', 'zho');"
    )
    session.commit()


def downgrade() -> None:
    pass
