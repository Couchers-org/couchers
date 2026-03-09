from functools import lru_cache
from pathlib import Path

from couchers.i18n.i18next import I18Next
from couchers.i18n.locales import load_locales


@lru_cache(maxsize=1)
def get_notifs_i18next() -> I18Next:
    """Gets the I18Next instance for notifications."""
    return load_locales(Path(__file__).parent / "locales")
