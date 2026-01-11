# Translator Guide

Thanks for helping us build the next generation of couch surfing! As a translator, you bring your language and cultural expertise to make Couchers feel natural to speakers of that language and residents of its associated countries. You'll be working with other translators and engineers to achieve this.

## Introduction to translating software

Translating software is a little different from translating a document. Feel free to skip this section if you're familiar with the process. Otherwise, let's first get familiar with a few terms:

- **Translation**: The work of converting text from one language to another.
- **Localization (l10n)**: The broader work of adapting a product to a different language and culture.
- **Internationalization (i18n)**: The work of enabling a product to be localizable to different languages and cultures.
- **String**: A translatable piece of text that appears somewhere in the software, for example the "Submit" text of a button, or a paragraph in this document.
- **Computer Assisted Translation (CAT)** tool: A software used to translate strings between languages, in our case [Weblate](https://docs.weblate.org/en/latest/).

### What makes a string?

Each string has a few components:

- A **key**, which uniquely identifies the string across languages, for example `profile.home_heading`.
- A **source language string**: in our case the English text of the string, which serves as a reference for translations, for example `My Home`.
- One **target language string** per target language: those are the translations, for example `Mi casa`.
- **Comments** and **screenshots**: additional information to help translators understand the context in which the string appears.

### Where do strings come from?

As engineers build Couchers features, they might need to add or update application text. To define a new translatable string, they will choose a string key, write the English text, and submit it as part of their code change, as a [GitHub pull request](https://github.com/Couchers-org/couchers/pulls). Once their changes is approved and integrated in Couchers, the new or updated strings will show up in Weblate and translators will get notified.

## Your responsibilities

### Lead translators

As a lead translator, you are responsible for the overall quality of the Couchers experience in your language and associated countries. It's worth taking a step back and defining standards for translating to your language.

- Define the voice and style for your language, for example the level of formality and grammatical preferences like the use of imperative vs infinitive.
- Build a glossary that standardizes key terms' translations to ensure consistency between translators.
- Identify external sources of reference or guidance for your languages, for example the Real Academia Española for Spanish.
- Coordinate information and work between translators of your target language.
- Review and approve suggested translations.

### All translators

- Translate new strings and update translations when strings change.
- Use Couchers in your target language to validate the quality of the translation as a whole (and report bugs!)
- Report issues with non-text aspects of Couchers in your language, such as text not available for translation, layout issues, invalid date formats or currencies, or cultural references.
- Report problematic strings, including missing context, inability to pluralize, or untranslatability.

## Your toolkit

We host a [Weblate instance](https://translate.couchershq.org/projects/couchers/) as our computer-assisted translation tool, it integrates many useful tools:

- **Translation memory**: As part of the translation process, it is normal to translate several similar, maybe even identical strings. Approved translators will have access to the "Automatic suggestions" tab, which offer suggestions based on similar previously translated strings as well as automated translations providers.
- **Glossary**: Your language's glossary defines standard translations for key terms, like "host", that should be translated identically by all translators. Weblate will highlight string words that have a glossary entry, but note that redundant entries for variants of the term (e.g. "host" and "hosts") need to be defined.
- **Special characters**: Some languages require hard-to-type characters such as ellipses (…), special quotation marks («») or non-breaking spaces. Weblate offers quick buttons to input these.
- **Comments**: Add comments to raise problems with a string to fellow translators or for engineers to look at.
- **Screenshots and explanations**: Additional contextual information to help translate the string.

Approved translators should join our Slack workspace for more direct communication with the engineering team and other translators.

### Special strings

Strings can contain special content which require extra care:

- **Placeholders**: If the English string contains a word surrounded by double curly braces, such as `{{name}}`, this is a placeholder. When navigating the website, it will replaced with the actual information, like `Bob`. You must preserve that placeholder (i.e. do not modify the text, including its curly braces), but you may move it around based on the grammar of your language.
- **Pluralizable placeholders**: The `{{count}}` placeholder is special. When it appears, Weblate should allow you to enter plural variants, such as `{{count}} user` for the singular and `{{count}} users` for the plural. Every language has a different set of plural categories, and we follow the [Unicode CLDR rules](https://cldr.unicode.org/index/cldr-spec/plural-rules). Take a moment to get familiar with the definitions for [your language](https://www.unicode.org/cldr/charts/48/supplemental/language_plural_rules.html).
- **Markup**: Occasionally, strings may contain HTML-like markup like `Make sure you have a <bold>biometric</bold> passport`. The `<bold>` and `</bold>` define the beginning and end of a special formatting of the string, and must such be preserved (do not translate "bold"), but you may move that begin/end pair around based on the grammar of your language.

## Collaborating with engineers

Working closely with engineers will help improve the translation quality for your and all other languages. Engineers are often not as deeply familiar with the translation process as you are, so it is your responsibility to bring up problems involving translation or the general experience of using Couchers in your language, including:

- A string's key and English text do not provide enough context to translate accurately.
- A piece of text is broken apart into small strings that cannot be individually translated.
- A placeholder's format is unclear, or could result in different translations.
- A string has a numerical placeholder, but Weblate does not allow you to enter plural variants.
- A piece of text is not exposed for translation.
- A piece of text in the UI appears cut off in your language.
- A piece of text is culturally sensitive or invalid in your language, e.g. "three football fields".
- A date/time or currency format is incorrect in your language.
- A Weblate feature is not working as expected.

Specific string-related issues can be reported directly in Weblate using the "Comments" tool. Other issues can be reported through the Couchers "Report a problem" tool, or by joining the Couchers Slack workspace for direct communication with engineers. When linking to a specific string, use Weblate's "Copy permalink" tool instead of copying from your browser's address bar.

To understand what to expect from engineer-written strings, review our [engineer-facing best practices guide](https://github.com/Couchers-org/couchers/blob/develop/docs/localization.md). If you believe new strings are not up to that standard, please bring it up! This feedback loop will help all translations.

## Getting started!

### Setting up your Weblate account

Sign up or sign into your [Couchers Weblate](https://translate.couchershq.org/) account. When setting up your account, it is useful to enter other languages you are familiar with as well as the language you intend to translate for, so Weblate will show you other languages' translations for inspiration. Be sure to also watch the [Couchers project](https://translate.couchershq.org/projects/couchers/) so you get notified by email anytime new strings are available for translation.

### Contributing translations

1. Use the "Languages" menu to navigate to the Couchers project in your language. You should see a list of our app's components and the current progress translating its strings.
2. Pick on a component that you wish to contribute translations to, then click "Translate". You should see the main translation interface for an untranslated string.
3. Review the English text, string key, glossary, attachments and suggested translations to come up with your translation. Once written, click the "Suggest" button to send to your lead translator for review.
