#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { findEnJsonFiles, validateLanguageCode } from "./create-translation-files.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function deleteTranslationFile(filePath, languageCode) {
  const targetPath = filePath.replace("en.json", `${languageCode}.json`);

  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
    console.log(`🗑️  Deleted: ${targetPath}`);
    return true;
  } else {
    console.log(`⚠️  File not found: ${targetPath}`);
    return false;
  }
}

function removeFromAllLanguages(languageCode) {
  const allLanguagesPath = path.join(__dirname, "..", "i18n", "allLanguages.js");

  try {
    let content = fs.readFileSync(allLanguagesPath, "utf8");

    // Check if language exists
    if (!content.includes(`"${languageCode}"`)) {
      console.log(`⚠️  Language "${languageCode}" not found in allLanguages.js`);
      return false;
    }

    // Remove the language code from the array
    const lines = content.split("\n");
    const updatedLines = lines.filter((line) => !line.includes(`"${languageCode}"`));

    // Write back to file
    fs.writeFileSync(allLanguagesPath, updatedLines.join("\n"));
    console.log(`✅ Removed "${languageCode}" from allLanguages.js`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to remove from allLanguages.js: ${error.message}`);
    return false;
  }
}

function removeFromConstants(languageCode) {
  const constantsPath = path.join(__dirname, "..", "i18n", "constants.ts");

  try {
    let content = fs.readFileSync(constantsPath, "utf8");

    // Check if language exists (handle both quoted and unquoted keys)
    const quotedKey = `"${languageCode}": {`;
    const unquotedKey = `${languageCode}: {`;
    if (!content.includes(quotedKey) && !content.includes(unquotedKey)) {
      console.log(`⚠️  Language "${languageCode}" not found in constants.ts`);
      return false;
    }

    // Find and remove the language entry
    const lines = content.split("\n");
    const languageStart = lines.findIndex((line) => line.includes(quotedKey) || line.includes(unquotedKey));

    if (languageStart === -1) {
      console.log(`⚠️  Language "${languageCode}" entry not found in constants.ts`);
      return false;
    }

    // Find the end of the language entry (look for the closing brace and comma)
    let languageEnd = languageStart;
    for (let i = languageStart; i < lines.length; i++) {
      if (lines[i].trim() === "},") {
        languageEnd = i;
        break;
      }
    }

    // Remove the language entry
    lines.splice(languageStart, languageEnd - languageStart + 1);

    // Write back to file
    fs.writeFileSync(constantsPath, lines.join("\n"));
    console.log(`✅ Removed "${languageCode}" from constants.ts`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to remove from constants.ts: ${error.message}`);
    return false;
  }
}

function removeFromNativeAllLanguages(languageCode) {
  const nativeAllLanguagesPath = path.join(__dirname, "..", "..", "native", "i18n", "allLanguages.js");

  try {
    let content = fs.readFileSync(nativeAllLanguagesPath, "utf8");

    // Check if language exists
    if (!content.includes(`"${languageCode}"`)) {
      console.log(`⚠️  Language "${languageCode}" not found in native allLanguages.js`);
      return false;
    }

    // Remove the language code from the array
    const lines = content.split("\n");
    const updatedLines = lines.filter((line) => !line.includes(`"${languageCode}"`));

    // Write back to file
    fs.writeFileSync(nativeAllLanguagesPath, updatedLines.join("\n"));
    console.log(`✅ Removed "${languageCode}" from native allLanguages.js`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to remove from native allLanguages.js: ${error.message}`);
    return false;
  }
}

function removeFromResourceLanguageNames(languageCode) {
  const resourcesEnPath = path.join(__dirname, "..", "resources", "locales", "en.json");

  try {
    const raw = fs.readFileSync(resourcesEnPath, "utf8");
    const json = JSON.parse(raw);

    if (!json.language_names || !json.language_names[languageCode]) {
      console.log(`⚠️  language_names does not contain "${languageCode}" in resources en.json`);
      return false;
    }

    delete json.language_names[languageCode];
    fs.writeFileSync(resourcesEnPath, JSON.stringify(json, null, 2) + "\n");
    console.log(`✅ Removed "${languageCode}" from resources language_names`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to update resources language_names: ${error.message}`);
    return false;
  }
}

function main() {
  try {
    const languageCode = process.argv[2];

    // Validate language code
    validateLanguageCode(languageCode);

    console.log(`🗑️  Deleting translation files for language: ${languageCode}`);

    // Find all en.json files to determine which translation files to delete
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

    console.log(`📁 Found ${enJsonFiles.length} translation files to process...\n`);

    // Delete translation files
    let deletedCount = 0;
    for (const file of enJsonFiles) {
      if (deleteTranslationFile(file, languageCode)) {
        deletedCount++;
      }
    }

    console.log(`\n🎉 Successfully deleted ${deletedCount} translation files for ${languageCode}!`);

    console.log("\n🔧 Removing language from translation system...");

    // Remove from allLanguages.js
    const removedFromAllLanguages = removeFromAllLanguages(languageCode);

    // Remove from constants.ts
    const removedFromConstants = removeFromConstants(languageCode);

    // Remove from native allLanguages.js
    const removedFromNative = removeFromNativeAllLanguages(languageCode);
    const removedFromResourceNames = removeFromResourceLanguageNames(languageCode);

    console.log("\n📋 Summary:");
    if (removedFromAllLanguages && removedFromConstants && removedFromNative && removedFromResourceNames) {
      console.log("✅ Language successfully removed from translation system!");
    } else {
      console.log("⚠️  Some files may not have contained the language or had issues.");
    }

    console.log("\n🎯 Language deletion complete!");
    console.log("Note: You may need to restart your development server for changes to take effect.");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { deleteTranslationFile, removeFromAllLanguages, removeFromConstants, removeFromNativeAllLanguages };
