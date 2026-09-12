/* eslint-disable */
const fs = require("fs");
const path = require("path");

const { allLanguages } = require("../i18n/allLanguages");
const { NAMESPACES, MOD } = require("../i18n/namespaces");
/* eslint-enable */

const RESOURCES_DIR = path.join(__dirname, "..", "resources", "locales");
const FEATURES_DIR = path.join(__dirname, "..", "features");

const UNTRANSLATED_NAMESPACES = [MOD];

function main(args) {
  const [outputFile] = args;
  if (!outputFile) {
    throw new Error("Usage: generate-translation-stats.js <output-file>");
  }
  writeTranslationStats(getAppTranslationStats(), outputFile);
}

// Writes the translation stats to the given output path.
function writeTranslationStats(appStats, outputFile) {
  const stats = Object.entries(appStats)
    .map(([code, { total, translated }]) => ({
      code,
      translated_percent: total === 0 ? 100 : Math.round((100 * translated) / total),
    }))
    .sort((a, b) => a.code.localeCompare(b.code));

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(stats, null, 2) + "\n");
  console.log(
    `Generated translation stats for ${stats.length} locales at ${path.relative(process.cwd(), outputFile)}.`,
  );
}

// Counts total and translated strings for each locale of the whole app.
function getAppTranslationStats() {
  const appStats = {};
  for (const locale of allLanguages) {
    appStats[locale] = { total: 0, translated: 0 };
  }

  for (const namespace of NAMESPACES) {
    if (UNTRANSLATED_NAMESPACES.includes(namespace)) continue;

    const componentStats = getComponentTranslationStats(namespace);
    for (const locale of allLanguages) {
      appStats[locale].total += componentStats[locale].total;
      appStats[locale].translated += componentStats[locale].translated;
    }
  }

  return appStats;
}

// Counts total and translated strings for a component of the app.
// "en" is always fully translated.
function getComponentTranslationStats(name) {
  const localeDir = name === "global" ? RESOURCES_DIR : path.join(FEATURES_DIR, name, "locales");

  const enKeys = readLocaleKeys(path.join(localeDir, "en.json"));

  const stats = {};
  for (const locale of allLanguages) {
    const weblateLocale = locale.replace("-", "_");
    const localePath = path.join(localeDir, `${weblateLocale}.json`);
    const localeKeys = locale === "en" ? enKeys : readLocaleKeys(localePath);

    let translated = 0;
    for (const key of enKeys) {
      if (localeKeys.has(key)) translated++;
    }

    stats[locale] = { total: enKeys.size, translated };
  }
  return stats;
}

// Read all string keys from a given locale file.
function readLocaleKeys(filePath) {
  const keys = new Set();
  if (!fs.existsSync(filePath)) {
    return keys;
  }

  const contents = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  gatherFlattenedKeys(keys, contents);
  return keys;
}

// Recursively gathers a locale JSON object's normalized leaf-key paths that
// hold a non-empty string value into the given Set.
function gatherFlattenedKeys(keys, obj, prefix) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${normalizeKey(key)}` : normalizeKey(key);
    if (typeof value === "string") {
      if (value.length > 0) keys.add(path);
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      gatherFlattenedKeys(keys, value, path);
    }
  }
}

function normalizeKey(key) {
  // Ignore CLDR plural categories as they vary between languages.
  // Assume that if any plural form is defined, the string is defined.
  return key.replace(/_(zero|one|two|few|many|other)$/, "");
}

module.exports = main;

if (require.main === module) {
  // node scripts/generate-translation-stats.js <args>
  main(process.argv.slice(2));
}
