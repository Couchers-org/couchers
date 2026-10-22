# Localization

We use the [i18next file format](https://www.i18next.com/misc/json-format) (version 4) to define our localizable strings. On the frontend, we use the [i18next library](https://www.i18next.com/). On the backend, we have a hand-rolled implementation, since no official one was available.

i18next is a key-based monolingual localization format (each file maps keys to strings of a single language). It has native support for plurals, using [Unicode CLDR-compatible](https://www.unicode.org/cldr/charts/48/supplemental/language_plural_rules.html) plural suffixes. A string that includes a `{{count}}` placeholder can define plural variants such as `my_string_one`, `my_string_many` and `my_string_other` (for a language such as Spanish), which can all be resolved using the `my_string` key.

Translators use our [Weblate instance](https://translate.couchershq.org/projects/couchers/) as their computer-assisted translation tool. Weblate will periodically create pull requests that update non-English languages' i18next `.json` files

## Best practices for strings

All user-visible strings should be externalized to `en.json` files as to be localizable. This is a great first step, but ambiguous or difficult to translate strings can still result in poor translations, or a costly feedback loop when engineers are needed to update the original string, so it's worth spending an extra minute to design your localizable strings well, especially leveraging the key to provide as much context as possible.

### Writing strings

- ✅ **DO** use placeholders to inject information known by the code into the string, e.g. a user's name into a greeting.
- ✅ **DO** use simple HTML/Markdown sentence-internal markup in the string, rather than breaking it up and concatenating its parts.
  - **Good** 👍: `inactive_label` = `This user is <bold>inactive</bold>`.
  - **Bad** 👎: `inactive_label_start` = `This user is ` and `inactive_label_bold` = `inactive`.
- ❌ **AVOID**: leading/trailing whitespace or commas as they are confusing for translators and they are a sign of concatenation.

### Choosing string keys

String keys are our main way to communicate context to translators. It's okay to be verbose! A good rule of thumb is that short strings especially need long keys.

- ✅ **DO** describe what the string is for, independently of its English phrasing. A user familiar with the app should be able to deduce the likely location of the string in the UI from its key.
  - **Good** 👍: `home_page.heading` (for a string like `{{name}}'s page`), `photo_gallery.upload_button`.
  - **Bad** 👎: `profile`, `photos`, `upload`.
- ✅ **DO** disambiguate the string's role in the UI using suffixes, especially for short strings. Examples:
  - `_header`: The string introduces a section of the UI.
  - `_button`/`_link`: The string can be clicked to perform an action.
  - `_label`: The string describes a related input control, e.g. a textfield or radio button.
  - `_message`: The string informs the user about the result of an action.
  - `_a11y`: The string is the accessible description of a control, e.g. for screen readers.
  - `_tooltip`: The string is displayed as a tooltip when hovering over a control.
- ✅ **DO** group related strings hierarchically. This provides extra context to translators.
  - **Good** 👍: `communities.event.start_date_label`.
- ❌ **AVOID** using single words or very short keys (see above!)
- ❌ **AVOID** string keys that replicate the English strings.
- ❌ **AVOID** defining generic strings and using them in many different contexts, e.g. `update` or `label`, since those could translate to different words depending on context. Translators have tools to reuse translations if they want to, so duplication is not a concern.

### Using placeholders

Placeholders allow inserting values known at runtime into the string. They are always preferable to concatenating strings in code, since they allow for reordering based on the language's grammar.

- ✅ **DO** use descriptive placeholder names that allow translators to anticipate the format of the substituted string. It's okay to be verbose!
  - **Good** 👍: `{{full_name}}`, `{{date_and_time_with_day}}`, `{{amount_and_currency}}`.
  - **Bad** 👎: `{{when}}`, `{{value}}`, `{{x}}`.
- ✅ **DO** allow for pluralization of integer values, even if they will never be 1. i18next requires the placeholder to be named `{{count}}` and Weblate requires `en.json` to define both `***_one` and `***_other` string variants.
  - **Good** 👍: `member_count_one` = `{{count}} member` and `member_count_other` = `{{count}} members`.
  - **Bad** 👎: `member_count` = `{{members}} members`, `member_count_plural` = `{{count}} members`.
- ✅ **DO** change the string key if the format or name of a placeholder changes, to force retranslation. If necessary, add a version suffix like "mystring2".
- ❌ **AVOID** placeholders with custom complex content, e.g. a range `[10, 20)`, since the internal format may vary between locales. Date/times are okay if generated in a locale-aware way.

## Adding/removing languages

Developers can use our automated scripts to add new languages to the codebase for i18n translation. If you are a translator and want to add a new language, you can direct a developer here to help you.

### Adding a new language

```bash
cd app/web
yarn create-translation-files <language-code>
```

Example:

```bash
yarn create-translation-files sv  # Adds Swedish
yarn create-translation-files uk  # Adds Ukrainian
```

This script will:
- Create empty translation files for all features (except mod)
- Add the language to `allLanguages.js` and `constants.ts`
- Seed the language name. The entry added to `constants.ts` gets a placeholder `nativeName` (the language's autonym, shown in the picker) for a maintainer to replace with the correct value, and the English name is added to `language_names` in `resources/locales/en.json`. Language codes might need to be added to the `LANGUAGE_NAMES` map in `scripts/create-translation-files.js` once if not already there.

### Removing a language

```bash
cd app/web
yarn delete-translation-files <language-code>
```

Example:

```bash
yarn delete-translation-files sv  # Removes Swedish
```

This script will:
- Delete all translation files for the language
- Remove the language from `allLanguages.js` and `constants.ts`
- Remove the English name from `language_names` in `resources/locales/en.json`
- Also remove from the native app's language list

Both scripts validate language codes and provide helpful feedback about the process.
