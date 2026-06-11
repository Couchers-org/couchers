from functools import cache
from pathlib import Path

from couchers.i18n.i18next import I18Next
from couchers.i18n.locales import load_locales


@cache
def get_emails_i18next() -> I18Next:
    return load_locales(Path(__file__).parent / "locales")
