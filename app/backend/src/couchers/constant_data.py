import json
import logging
from pathlib import Path

from couchers.db import session_scope
from couchers.models import Language

logger = logging.getLogger(__name__)


def update_languages():
    """
    Updates the database languages table to match the one in the embedded JSON file
    """
    with open(Path(__file__).parent / "data" / "languages.json", "r") as f:
        languages_raw = json.loads(f.read())

    # create a hash map of languages
    data_languages = {language["code"]: language["name"] for language in languages_raw}

    with session_scope() as session:
        new_languages = {language.code: language.name for language in session.query(Language).all()}

        missing_codes = set(data_languages.keys()) - set(new_languages.keys())
        extra_codes = set(new_languages.keys()) - set(data_languages.keys())

        for code in missing_codes:
            session.add(Language(code=code, name=data_languages[code]))

        for code in extra_codes:
            session.delete(session.query(Language).filter(Language.code == code).one())

        for code, name in data_languages.items():
            db_language = session.query(Language).filter(Language.code == code).one()
            if db_language.name != name:
                db_language.name = name


def update_constant_data():
    update_languages()
