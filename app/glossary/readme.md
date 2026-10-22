# Weblate Glossary Files

These files standardize how terms are translated between English and other languages (e.g. house -> casa).
This helps different translators to produce consistent translations when there could be multiple valid choices.

We have two glossaries, one for key terms, and one for language-specific entries.

## GNU `gettext` Portable Object Files (.po)

We use the `.po` format for the glossary because it is easy to edit by hand (for `key-terms/en.po`),
and supports both monolingual (for `key-terms`) and multilingual (for `language-specific`) variants.

`.tbx` is industry-standard but highly verbose and only usable in multilingual configurations.

## Key Terms Glossary

This glossary defines all of our app's key terms (e.g. host),
which should be translated consistently throughout the app, in `en.po`.

This is a monolingual `.po` configuration, meaning that translators
cannot add terms that do not exist in the base `en.po` file.

## Language-Specific Glossary

This glossary allows translators to additional terms whose translation they want to standardize for their language.
For example, French could map `you` to `vous` as a hint to translators to prefer the formal form.

## [FUTURE] Standardizing English Terms

Weblate glossaries cannot ensure that developers writing English string use terms consistently (e.g. "user" vs "member"). This would be a separate future system.
