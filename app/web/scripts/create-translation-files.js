#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Valid i18n language codes (ISO 639-1 and common variants)
// Add more as needed
const VALID_LANGUAGE_CODES = [
  "af",
  "ar",
  "az",
  "be",
  "bg",
  "bn",
  "bs",
  "ca",
  "cs",
  "cy",
  "da",
  "de",
  "el",
  "en",
  "eo",
  "es",
  "et",
  "eu",
  "fa",
  "fi",
  "fo",
  "fr",
  "ga",
  "gd",
  "gl",
  "he",
  "hi",
  "hr",
  "hu",
  "hy",
  "id",
  "is",
  "it",
  "ja",
  "ka",
  "kk",
  "km",
  "kn",
  "ko",
  "ku",
  "ky",
  "lb",
  "lo",
  "lt",
  "lv",
  "mk",
  "ml",
  "mn",
  "mr",
  "ms",
  "mt",
  "my",
  "nb",
  "ne",
  "nl",
  "nn",
  "oc",
  "or",
  "pa",
  "pl",
  "ps",
  "pt",
  "ro",
  "ru",
  "sk",
  "sl",
  "sq",
  "sr",
  "sv",
  "sw",
  "ta",
  "te",
  "th",
  "tk",
  "tr",
  "tt",
  "ug",
  "uk",
  "ur",
  "uz",
  "vi",
  "yi",
  "zh",
  // Common variants
  "en-US",
  "en-GB",
  "en-CA",
  "en-AU",
  "es-419",
  "es-MX",
  "es-AR",
  "fr-CA",
  "fr-BE",
  "pt-BR",
  "pt-PT",
  "zh-Hans",
  "zh-Hant",
  "zh-CN",
  "zh-TW",
  "nb-NO",
  "nn-NO",
  "sv-SE",
  "da-DK",
  "fi-FI",
  "nl-NL",
  "nl-BE",
  "de-DE",
  "de-AT",
  "de-CH",
  "it-IT",
  "it-CH",
  "pl-PL",
  "ru-RU",
  "uk-UA",
  "cs-CZ",
  "sk-SK",
  "hu-HU",
  "ro-RO",
  "bg-BG",
  "hr-HR",
  "sr-RS",
  "bs-BA",
  "mk-MK",
  "sl-SI",
  "et-EE",
  "lv-LV",
  "lt-LT",
  "el-GR",
  "mt-MT",
  "ca-ES",
  "eu-ES",
  "gl-ES",
  "cy-GB",
  "ga-IE",
  "gd-GB",
  "is-IS",
  "fo-FO",
  "sq-AL",
  "hy-AM",
  "ka-GE",
  "az-AZ",
  "kk-KZ",
  "ky-KG",
  "uz-UZ",
  "tk-TM",
  "tt-RU",
  "mn-MN",
  "ko-KR",
  "ja-JP",
  "zh-HK",
  "zh-MO",
  "th-TH",
  "vi-VN",
  "km-KH",
  "lo-LA",
  "my-MM",
  "bn-BD",
  "bn-IN",
  "ta-IN",
  "te-IN",
  "ml-IN",
  "kn-IN",
  "mr-IN",
  "gu-IN",
  "pa-IN",
  "hi-IN",
  "ur-PK",
  "ne-NP",
  "si-LK",
  "dv-MV",
  "ps-AF",
  "fa-IR",
  "he-IL",
  "ar-SA",
  "ar-EG",
  "ar-MA",
  "ar-DZ",
  "ar-TN",
  "ar-LY",
  "ar-SD",
  "ar-IQ",
  "ar-SY",
  "ar-LB",
  "ar-JO",
  "ar-KW",
  "ar-AE",
  "ar-BH",
  "ar-QA",
  "ar-OM",
  "ar-YE",
  "ar-IL",
  "ar-PS",
  "ar-TD",
  "ar-DJ",
  "ar-ER",
  "ar-SO",
  "ar-KM",
  "ar-TD",
  "ar-CF",
  "ar-CM",
  "ar-CG",
  "ar-CD",
  "ar-GA",
  "ar-GQ",
  "ar-GW",
  "ar-GN",
  "ar-ML",
  "ar-MR",
  "ar-NE",
  "ar-NG",
  "ar-SN",
  "ar-TG",
  "ar-BF",
  "ar-BJ",
  "ar-CI",
  "ar-GH",
  "ar-GM",
  "ar-GN",
  "ar-GW",
  "ar-LR",
  "ar-ML",
  "ar-MR",
  "ar-NE",
  "ar-NG",
  "ar-SL",
  "ar-SN",
  "ar-TG",
  "ar-BF",
  "ar-BJ",
  "ar-CI",
  "ar-GH",
  "ar-GM",
  "ar-GN",
  "ar-GW",
  "ar-LR",
  "ar-ML",
  "ar-MR",
  "ar-NE",
  "ar-NG",
  "ar-SL",
  "ar-SN",
  "ar-TG",
];

// Language names mapping for common languages - add more as needed
const LANGUAGE_NAMES = {
  sv: "Swedish",
  uk: "Ukrainian",
  de: "German",
  fr: "French",
  es: "Spanish",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  pl: "Polish",
  cs: "Czech",
  sk: "Slovak",
  hu: "Hungarian",
  ro: "Romanian",
  bg: "Bulgarian",
  hr: "Croatian",
  sr: "Serbian",
  bs: "Bosnian",
  mk: "Macedonian",
  sl: "Slovenian",
  et: "Estonian",
  lv: "Latvian",
  lt: "Lithuanian",
  el: "Greek",
  mt: "Maltese",
  ca: "Catalan",
  eu: "Basque",
  gl: "Galician",
  cy: "Welsh",
  ga: "Irish",
  gd: "Scottish Gaelic",
  is: "Icelandic",
  fo: "Faroese",
  sq: "Albanian",
  hy: "Armenian",
  ka: "Georgian",
  az: "Azerbaijani",
  kk: "Kazakh",
  ky: "Kyrgyz",
  uz: "Uzbek",
  tk: "Turkmen",
  tt: "Tatar",
  mn: "Mongolian",
  ko: "Korean",
  ja: "Japanese",
  zh: "Chinese",
  th: "Thai",
  vi: "Vietnamese",
  km: "Khmer",
  lo: "Lao",
  my: "Burmese",
  bn: "Bengali",
  ta: "Tamil",
  te: "Telugu",
  ml: "Malayalam",
  kn: "Kannada",
  mr: "Marathi",
  gu: "Gujarati",
  pa: "Punjabi",
  hi: "Hindi",
  ur: "Urdu",
  ne: "Nepali",
  si: "Sinhala",
  dv: "Divehi",
  ps: "Pashto",
  fa: "Persian",
  he: "Hebrew",
  ar: "Arabic",
  tr: "Turkish",
  id: "Indonesian",
  ms: "Malay",
  tl: "Filipino",
  sw: "Swahili",
  am: "Amharic",
  ti: "Tigrinya",
  so: "Somali",
  ha: "Hausa",
  yo: "Yoruba",
  ig: "Igbo",
  zu: "Zulu",
  xh: "Xhosa",
  af: "Afrikaans",
  nl: "Dutch",
  da: "Danish",
  no: "Norwegian",
  fi: "Finnish",
  sv: "Swedish",
  is: "Icelandic",
  fo: "Faroese",
  nb: "Norwegian Bokmål",
  nn: "Norwegian Nynorsk",
};

// Flag codes mapping (ISO 3166-1 alpha-2 country codes)
const FLAG_CODES = {
  sv: "SE",
  uk: "UA",
  de: "DE",
  fr: "FR",
  es: "ES",
  it: "IT",
  pt: "PT",
  ru: "RU",
  pl: "PL",
  cs: "CZ",
  sk: "SK",
  hu: "HU",
  ro: "RO",
  bg: "BG",
  hr: "HR",
  sr: "RS",
  bs: "BA",
  mk: "MK",
  sl: "SI",
  et: "EE",
  lv: "LV",
  lt: "LT",
  el: "GR",
  mt: "MT",
  ca: "ES", // Catalan uses Spanish flag
  eu: "ES", // Basque uses Spanish flag
  gl: "ES", // Galician uses Spanish flag
  cy: "GB", // Welsh uses UK flag
  ga: "IE",
  gd: "GB", // Scottish Gaelic uses UK flag
  is: "IS",
  fo: "FO",
  sq: "AL",
  hy: "AM",
  ka: "GE",
  az: "AZ",
  kk: "KZ",
  ky: "KG",
  uz: "UZ",
  tk: "TM",
  tt: "RU", // Tatar uses Russian flag
  mn: "MN",
  ko: "KR",
  ja: "JP",
  zh: "CN",
  th: "TH",
  vi: "VN",
  km: "KH",
  lo: "LA",
  my: "MM",
  bn: "BD",
  ta: "IN",
  te: "IN",
  ml: "IN",
  kn: "IN",
  mr: "IN",
  gu: "IN",
  pa: "IN",
  hi: "IN",
  ur: "PK",
  ne: "NP",
  si: "LK",
  dv: "MV",
  ps: "AF",
  fa: "IR",
  he: "IL",
  ar: "SA", // Arabic uses Saudi Arabia flag
  tr: "TR",
  id: "ID",
  ms: "MY",
  tl: "PH",
  sw: "TZ",
  am: "ET",
  ti: "ER",
  so: "SO",
  ha: "NG",
  yo: "NG",
  ig: "NG",
  zu: "ZA",
  xh: "ZA",
  af: "ZA",
  nl: "NL",
  da: "DK",
  no: "NO",
  fi: "FI",
  nb: "NO",
  nn: "NO",
};

function validateLanguageCode(code) {
  if (!code) {
    throw new Error(
      "❌ No language code provided. Usage: yarn create-translation-files <language-code>",
    );
  }

  if (!VALID_LANGUAGE_CODES.includes(code)) {
    throw new Error(
      `❌ Invalid language code: "${code}". Please provide a valid ISO 639-1 language code or common variant.`,
    );
  }

  return true;
}

function findEnJsonFiles(dir, baseDir = "") {
  const files = [];

  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = path.join(baseDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules and other common directories to avoid
        if (
          item === "node_modules" ||
          item === ".git" ||
          item === "dist" ||
          item === "build"
        ) {
          continue;
        }
        // Skip the mod folder
        if (item === "mod") {
          continue;
        }
        files.push(...findEnJsonFiles(fullPath, relativePath));
      } else if (item === "en.json") {
        files.push(relativePath);
      }
    }
  } catch (error) {
    // Skip directories we can't read
    console.warn(
      `⚠️  Warning: Could not read directory ${dir}: ${error.message}`,
    );
  }

  return files;
}

function createTranslationFile(filePath, languageCode) {
  const targetPath = filePath.replace(
    "en.json",
    `${languageCode.replace("-", "_")}.json`,
  );

  // Create directory if it doesn't exist
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Create the translation file if it doesn't exist
  if (!fs.existsSync(targetPath)) {
    fs.writeFileSync(targetPath, "{\n}\n");
    console.log(`✅ Created: ${targetPath}`);
  }
}

function getLanguageName(code) {
  // Handle variants like 'es-419', 'fr-CA', etc.
  const baseCode = code.split("-")[0];
  return LANGUAGE_NAMES[baseCode] || LANGUAGE_NAMES[code] || code;
}

function getFlagCode(code) {
  // Handle variants like 'es-419', 'fr-CA', etc.
  const baseCode = code.split("-")[0];
  return FLAG_CODES[baseCode] || FLAG_CODES[code] || null;
}

function addToResourceLanguageNames(languageCode) {
  const resourcesEnPath = path.join(
    __dirname,
    "..",
    "resources",
    "locales",
    "en.json",
  );

  try {
    const raw = fs.readFileSync(resourcesEnPath, "utf8");
    const json = JSON.parse(raw);

    if (!json.language_names) {
      json.language_names = {};
    }

    if (json.language_names[languageCode]) {
      console.log(
        `⚠️  language_names already contains "${languageCode}" in resources en.json`,
      );
      return false;
    }

    const displayName = getLanguageName(languageCode);
    json.language_names[languageCode] = displayName;

    // Write pretty-printed JSON with trailing newline
    fs.writeFileSync(resourcesEnPath, JSON.stringify(json, null, 2) + "\n");
    console.log(
      `✅ Added "${languageCode}": "${displayName}" to en.json translation file`,
    );
    return true;
  } catch (error) {
    console.error(
      `❌ Failed to update resources language_names: ${error.message}`,
    );
    return false;
  }
}

function addToAllLanguages(languageCode) {
  const allLanguagesPath = path.join(
    __dirname,
    "..",
    "i18n",
    "allLanguages.js",
  );

  try {
    let content = fs.readFileSync(allLanguagesPath, "utf8");

    // Check if language already exists
    if (content.includes(`"${languageCode}"`)) {
      console.log(
        `⚠️  Language "${languageCode}" already exists in allLanguages.js`,
      );
      return false;
    }

    // Find the array and add the language code in alphabetical order
    const lines = content.split("\n");
    const languageArrayStart = lines.findIndex((line) =>
      line.includes("const allLanguages = ["),
    );

    if (languageArrayStart === -1) {
      throw new Error("Could not find allLanguages array");
    }

    // Find where to insert the new language code
    let insertIndex = languageArrayStart + 1;
    for (let i = languageArrayStart + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === "];") {
        insertIndex = i;
        break;
      }
      if (line.startsWith('"') && line.endsWith(",")) {
        const existingCode = line.replace(/["',]/g, "");
        if (existingCode > languageCode) {
          insertIndex = i;
          break;
        }
      }
    }

    // Insert the new language code
    const indent = "  ";
    lines.splice(insertIndex, 0, `${indent}"${languageCode}",`);

    // Write back to file
    fs.writeFileSync(allLanguagesPath, lines.join("\n"));
    console.log(`✅ Added "${languageCode}" to allLanguages.js`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to add to allLanguages.js: ${error.message}`);
    return false;
  }
}

function addToConstants(languageCode, languageName, flagCode) {
  const constantsPath = path.join(__dirname, "..", "i18n", "constants.ts");

  try {
    let content = fs.readFileSync(constantsPath, "utf8");

    // Check if language already exists
    if (content.includes(`${languageCode}: {`)) {
      console.log(
        `⚠️  Language "${languageCode}" already exists in constants.ts`,
      );
      return false;
    }

    // Find the LANGUAGE_MAP object
    const lines = content.split("\n");
    const mapStart = lines.findIndex((line) =>
      line.includes("export const LANGUAGE_MAP: LanguageMap = {"),
    );

    if (mapStart === -1) {
      throw new Error("Could not find LANGUAGE_MAP");
    }

    // Find where to insert the new language entry in alphabetical order
    let insertIndex = mapStart + 1;
    for (let i = mapStart + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === "};") {
        insertIndex = i;
        break;
      }
      if (line.includes(": {") && !line.includes("export const")) {
        const existingCode = line.split(":")[0].trim().replace(/['"]/g, "");
        if (existingCode > languageCode) {
          insertIndex = i;
          break;
        }
      }
    }

    // Create the new language entry
    const indent = "  ";
    const newEntry = [
      `${indent}"${languageCode}": {`,
      `${indent}  name: "${languageName}",`,
      // Placeholder autonym — a maintainer should replace this with the
      // language's name in its own language (shown in the language picker).
      `${indent}  nativeName: "${languageName}",`,
      `${indent}  flagIconCode: "${flagCode || "XX"}",`,
      `${indent}},`,
    ];

    // Insert the new entry
    if (!content.includes(`"${languageCode}"`)) {
      lines.splice(insertIndex, 0, ...newEntry);
    }

    // Write back to file
    fs.writeFileSync(constantsPath, lines.join("\n"));
    console.log(`✅ Added "${languageCode}" to constants.ts`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to add to constants.ts: ${error.message}`);
    return false;
  }
}

function main() {
  try {
    const languageCode = process.argv[2];

    // Validate language code
    validateLanguageCode(languageCode);

    console.log(`🚀 Creating translation files for language: ${languageCode}`);
    console.log(`📝 Language name: ${getLanguageName(languageCode)}`);

    // Find all en.json files
    const enJsonFiles = findEnJsonFiles(".");

    // Add backend en.json file (outside of web directory)
    const backendEnJsonPath = path.join(
      __dirname,
      "..",
      "..",
      "backend",
      "src",
      "couchers",
      "i18n",
      "locales",
      "en.json",
    );
    if (fs.existsSync(backendEnJsonPath)) {
      enJsonFiles.push(path.relative(".", backendEnJsonPath));
    }

    if (enJsonFiles.length === 0) {
      console.log("⚠️  No en.json files found in the current directory tree.");
      return;
    }

    console.log(`📁 Found ${enJsonFiles.length} en.json files to process...\n`);

    // Create translation files
    let createdCount = 0;
    for (const file of enJsonFiles) {
      createTranslationFile(file, languageCode);
      createdCount++;
    }

    console.log(
      `\n🎉 Successfully created ${createdCount} translation files for ${languageCode}!`,
    );

    // Get language info
    const flagCode = getFlagCode(languageCode);
    const languageName = getLanguageName(languageCode);

    console.log("\n🔧 Adding language to translation system...");

    // Add to allLanguages.js
    const addedToAllLanguages = addToAllLanguages(languageCode);

    // Add to constants.ts
    const addedToConstants = addToConstants(
      languageCode,
      languageName,
      flagCode,
    );

    // Also add to web resources language_names
    const addedToResourceNames = addToResourceLanguageNames(languageCode);

    console.log("\n📋 Summary:");
    if (addedToAllLanguages && addedToConstants && addedToResourceNames) {
      console.log("✅ Language successfully added to translation system!");
    } else {
      console.log(
        "⚠️  Some files may already contain the language or had issues.",
      );
    }

    if (!flagCode) {
      console.log(
        `⚠️  No flag code found for "${languageCode}". You may want to update the flag code in constants.ts manually.`,
      );
    }

    console.log("\n🎯 Next steps:");
    console.log("1. Start translating the created files!");
    console.log("2. Test the translations in your application.");
    console.log("3. Update the flag code in constants.ts if needed.");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createTranslationFile, findEnJsonFiles, validateLanguageCode };
