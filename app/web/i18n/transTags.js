/**
 * Helpers for the markup tags embedded in translated strings, e.g. the
 * `<signupLink>` in `No account yet? <signupLink>Join us</signupLink>`.
 *
 * Shared by the `couchers/trans-components` ESLint rule and by
 * `i18n/locales.test.ts`, so this file must stay plain CommonJS with no imports
 * (the ESLint rule loads it outside of any bundler).
 *
 * See /docs/translation-components.md.
 */

// react-i18next renders these as themselves, so they need no `components` entry
// (transKeepBasicHtmlNodesFor, react-i18next/src/defaults.js).
const BASIC_HTML_TAGS = ["br", "strong", "i", "p"];

// Unicode CLDR plural categories, as i18next suffixes them onto the key.
const PLURAL_SUFFIXES = ["zero", "one", "two", "few", "many", "other"];

// `<a>`, `</a>`, `<a />`, `<a href="x">`, `<1>`. A tag name is what
// react-i18next's html parser accepts.
const TAG = /<(\/?)([a-zA-Z0-9_-]+)(\s[^>]*?)?\/?>/g;

/** Tag names in a string, in order of appearance, one entry per opening tag. */
function extractTags(value) {
  return Array.from(value.matchAll(TAG))
    .filter(([, closing]) => !closing)
    .map(([, , name]) => name);
}

/**
 * The markup a string carries, as a sorted list of `name`/`/name` tokens, for
 * comparing a translation against its English source. Sorted rather than
 * ordered because languages reorder the sentence around the tags.
 */
function tagSignature(value) {
  return Array.from(value.matchAll(TAG), ([, closing, name]) => `${closing}${name}`).sort();
}

/** Whether the tag renders on its own, with no entry in `components`. */
function isBasicHtmlTag(tag) {
  return BASIC_HTML_TAGS.includes(tag);
}

/** Path of a locale file, relative to app/web (mirrors next-i18next.config.js). */
function localeFilePath(namespace, locale) {
  const file = `${locale.replace("-", "_")}.json`;
  return namespace === "global" ? `resources/locales/${file}` : `features/${namespace}/locales/${file}`;
}

/**
 * Resolves a dotted i18next key against a loaded locale bundle.
 *
 * Returns every string it resolves to: a key with `{{count}}` resolves to one
 * string per plural form the bundle defines, and all of them have to agree with
 * the call site.
 */
function resolveKey(bundle, key) {
  const path = key.split(".");
  const last = path.pop();
  let node = bundle;
  for (const segment of path) {
    if (typeof node !== "object" || node === null) return [];
    node = node[segment];
  }
  if (typeof node !== "object" || node === null) return [];

  if (typeof node[last] === "string") return [{ key, value: node[last] }];

  return PLURAL_SUFFIXES.filter((suffix) => typeof node[`${last}_${suffix}`] === "string").map((suffix) => ({
    key: `${key}_${suffix}`,
    value: node[`${last}_${suffix}`],
  }));
}

module.exports = {
  BASIC_HTML_TAGS,
  PLURAL_SUFFIXES,
  extractTags,
  isBasicHtmlTag,
  localeFilePath,
  resolveKey,
  tagSignature,
};
