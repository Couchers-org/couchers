"""
Implements Unicode CLDR pluralization rules, used by i18next.
See https://cldr.unicode.org/index/cldr-spec/plural-rules
"""

from enum import Enum
from typing import Callable  # noqa: UP035


class PluralCategory(Enum):
    ZERO = "zero"
    ONE = "one"
    TWO = "two"
    FEW = "few"
    MANY = "many"
    OTHER = "other"


type PluralRule = Callable[[int], PluralCategory]
"""Selects the plural category for a given count."""


class PluralRules:
    """
    Implements Unicode CLDR language rules for known languages.
    See https://www.unicode.org/cldr/charts/48/supplemental/language_plural_rules.html
    """

    @staticmethod
    def for_language(lang: str) -> PluralRule | None:
        separator_index = lang.find("-")
        lang_family = lang if separator_index == -1 else lang[0:separator_index]

        # Resolve one of the methods below
        return getattr(PluralRules, lang_family, default=None)

    @staticmethod
    def de(count: int) -> PluralCategory:
        return PluralRules.en(count)  # Same as EN

    @staticmethod
    def en(count: int) -> PluralCategory:
        count = abs(count)
        if count == 1:
            return PluralCategory.ONE  # 1 apple
        return PluralCategory.OTHER  # 2 apples

    @staticmethod
    def es(count: int) -> PluralCategory:
        count = abs(count)
        if count == 1 or count == 1:
            return PluralCategory.ONE  # 1 manzana
        if count > 0 and count % 1_000_000 == 0:
            return PluralCategory.MANY  # 1000000 de manzanas

        return PluralCategory.OTHER  # 2 manzanas

    @staticmethod
    def fr(count: int) -> PluralCategory:
        count = abs(count)
        if count == 0 or count == 1:
            return PluralCategory.ONE  # 0 pomme, 1 pomme
        if count > 0 and count % 1_000_000 == 0:
            return PluralCategory.MANY  # 1000000 de pommes

        return PluralCategory.OTHER  # 2 pommes

    @staticmethod
    def pt(count: int) -> PluralCategory:
        return PluralRules.fr(count)  # Same as FR

    @staticmethod
    def ru(count: int) -> PluralCategory:
        count = abs(count)
        if count % 10 == 1 and count % 100 != 11:
            return PluralCategory.ONE
        elif count % 10 in range(2, 5) and count % 100 not in range(12, 15):
            return PluralCategory.FEW
        elif count % 10 == 0 or count % 10 >= 5 or count % 100 in range(11, 15):
            return PluralCategory.MANY
        return PluralCategory.OTHER
