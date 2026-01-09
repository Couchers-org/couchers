"""
Implements Unicode CLDR pluralization rules, used by i18next.
See https://cldr.unicode.org/index/cldr-spec/plural-rules
"""

from collections.abc import Callable
from enum import Enum


class PluralCategory(Enum):
    """
    Unicode CLDR plural categories, as defined on
    https://cldr.unicode.org/index/cldr-spec/plural-rules
    """

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
        # Look up one of the plural rule functions defined below
        return getattr(PluralRules, lang_family, None)

    @staticmethod
    def ca(count: int) -> PluralCategory:
        """Gets the Catalan plural category for a given count."""
        return PluralRules.es(count)  # Same as ES

    @staticmethod
    def cs(count: int) -> PluralCategory:
        """Gets the Czech plural category for a given count."""
        count = abs(count)
        if count == 1:
            return PluralCategory.ONE
        if count >= 2 and count <= 4:
            return PluralCategory.FEW
        return PluralCategory.OTHER

    @staticmethod
    def de(count: int) -> PluralCategory:
        """Gets the German plural category for a given count."""
        return PluralRules.en(count)  # Same as EN

    @staticmethod
    def en(count: int) -> PluralCategory:
        """Gets the English plural category for a given count."""
        count = abs(count)
        if count == 1:
            return PluralCategory.ONE  # 1 apple
        return PluralCategory.OTHER  # 2 apples

    @staticmethod
    def es(count: int) -> PluralCategory:
        """Gets the Spanish plural category for a given count."""
        count = abs(count)
        if count == 1:
            return PluralCategory.ONE  # 1 manzana
        if count > 0 and count % 1_000_000 == 0:
            return PluralCategory.MANY  # 1000000 de manzanas
        return PluralCategory.OTHER  # 2 manzanas

    @staticmethod
    def fr(count: int) -> PluralCategory:
        """Gets the French plural category for a given count."""
        count = abs(count)
        if count == 0 or count == 1:
            return PluralCategory.ONE  # 0 pomme, 1 pomme
        if count % 1_000_000 == 0:
            return PluralCategory.MANY  # 1000000 de pommes

        return PluralCategory.OTHER  # 2 pommes

    @staticmethod
    def he(count: int) -> PluralCategory:
        """Gets the Hebrew plural category for a given count."""
        count = abs(count)
        if count == 1:
            return PluralCategory.ONE
        if count == 2:
            return PluralCategory.TWO
        return PluralCategory.OTHER

    @staticmethod
    def hi(count: int) -> PluralCategory:
        """Gets the Hindi plural category for a given count."""
        count = abs(count)
        if count <= 1:
            return PluralCategory.ONE
        return PluralCategory.OTHER

    @staticmethod
    def hu(count: int) -> PluralCategory:
        """Gets the Hungarian plural category for a given count."""
        return PluralRules.en(count)  # Same as EN

    @staticmethod
    def it(count: int) -> PluralCategory:
        """Gets the Italian plural category for a given count."""
        return PluralRules.es(count)  # Same as ES

    @staticmethod
    def ja(count: int) -> PluralCategory:
        """Gets the Japanese plural category for a given count."""
        return PluralCategory.OTHER

    @staticmethod
    def nl(count: int) -> PluralCategory:
        """Gets the Dutch plural category for a given count."""
        return PluralRules.en(count)  # Same as EN

    @staticmethod
    def pl(count: int) -> PluralCategory:
        """Gets the Polish plural category for a given count."""
        count = abs(count)
        if count == 1:
            return PluralCategory.ONE
        if count % 10 in range(2, 5) and count % 100 not in range(12, 15):
            return PluralCategory.FEW
        return PluralCategory.MANY  # "Other" is reserved for decimals

    @staticmethod
    def pt(count: int) -> PluralCategory:
        """Gets the Portuguese plural category for a given count."""
        return PluralRules.fr(count)  # Same as FR

    @staticmethod
    def ru(count: int) -> PluralCategory:
        """Gets the Russian plural category for a given count."""
        count = abs(count)
        if count % 10 == 1 and count % 100 != 11:
            return PluralCategory.ONE
        elif count % 10 in range(2, 5) and count % 100 not in range(12, 15):
            return PluralCategory.FEW
        return PluralCategory.MANY  # OTHER is only for numbers with decimal separator.

    @staticmethod
    def sv(count: int) -> PluralCategory:
        """Gets the Swedish plural category for a given count."""
        return PluralRules.en(count)  # Same as EN

    @staticmethod
    def tr(count: int) -> PluralCategory:
        """Gets the Turkish plural category for a given count."""
        return PluralRules.en(count)  # Same as EN

    @staticmethod
    def uk(count: int) -> PluralCategory:
        """Gets the Ukrainian plural category for a given count."""
        return PluralRules.ru(count)  # Same as RU

    @staticmethod
    def zh(count: int) -> PluralCategory:
        """Gets the Chinese plural category for a given count."""
        return PluralCategory.OTHER
