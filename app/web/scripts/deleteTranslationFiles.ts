#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import log from "@/log.js";
import { getErrorMessage } from "@/utils/error.js";

import {
  findEnJsonFiles,
  validateLanguageCode,
} from "./createTranslationFiles.js";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const deleteTranslationFile = (filePath: string, languageCode: string) => {
  const targetPath = filePath.replace("en.json", `${languageCode}.json`);

  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
    console.log(`🗑️  Deleted: ${targetPath}`);
    return true;
  } else {
    console.log(`⚠️  File not found: ${targetPath}`);
    return false;
  }
};

const removeFromAllLanguages = (languageCode: string) => {
  const allLanguagesPath = path.join(dirname, "..", "i18n", "allLanguages.js");

  try {
    const content = fs.readFileSync(allLanguagesPath, "utf8");

    // Check if language exists
    if (!content.includes(`"${languageCode}"`)) {
      log.warn(`⚠️  Language "${languageCode}" not found in allLanguages.js`);
      return false;
    }

    // Remove the language code from the array
    const lines = content.split("\n");
    const updatedLines = lines.filter(
      (line) => !line.includes(`"${languageCode}"`),
    );

    // Write back to file
    fs.writeFileSync(allLanguagesPath, updatedLines.join("\n"));
    log.info(`✅ Removed "${languageCode}" from allLanguages.js`);
    return true;
  } catch (error) {
    log.error(
      `❌ Failed to remove from allLanguages.js: ${getErrorMessage(error)}`,
    );
    return false;
  }
};

const removeFromConstants = (languageCode: string) => {
  const constantsPath = path.join(dirname, "..", "i18n", "constants.ts");

  try {
    const content = fs.readFileSync(constantsPath, "utf8");

    // Check if language exists
    if (!content.includes(`${languageCode}: {`)) {
      log.warn(`⚠️  Language "${languageCode}" not found in constants.ts`);
      return false;
    }

    // Find and remove the language entry
    const lines = content.split("\n");
    const languageStart = lines.findIndex((line) =>
      line.includes(`${languageCode}: {`),
    );

    if (languageStart === -1) {
      log.warn(
        `⚠️  Language "${languageCode}" entry not found in constants.ts`,
      );
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
    log.info(`✅ Removed "${languageCode}" from constants.ts`);
    return true;
  } catch (error) {
    log.error(
      `❌ Failed to remove from constants.ts: ${getErrorMessage(error)}`,
    );
    return false;
  }
};

const removeFromNativeAllLanguages = (languageCode: string) => {
  const nativeAllLanguagesPath = path.join(
    dirname,
    "..",
    "..",
    "native",
    "i18n",
    "allLanguages.js",
  );

  try {
    const content = fs.readFileSync(nativeAllLanguagesPath, "utf8");

    // Check if language exists
    if (!content.includes(`"${languageCode}"`)) {
      log.warn(
        `⚠️  Language "${languageCode}" not found in native allLanguages.js`,
      );
      return false;
    }

    // Remove the language code from the array
    const lines = content.split("\n");
    const updatedLines = lines.filter(
      (line) => !line.includes(`"${languageCode}"`),
    );

    // Write back to file
    fs.writeFileSync(nativeAllLanguagesPath, updatedLines.join("\n"));
    log.info(`✅ Removed "${languageCode}" from native allLanguages.js`);
    return true;
  } catch (error) {
    log.error(
      `❌ Failed to remove from native allLanguages.js: ${getErrorMessage(error)}`,
    );
    return false;
  }
};

const main = () => {
  try {
    const languageCode = process.argv[2];

    // Validate language code
    validateLanguageCode(languageCode);

    log.info(`🗑️  Deleting translation files for language: ${languageCode}`);

    // Find all en.json files to determine which translation files to delete
    const enJsonFiles = findEnJsonFiles(".");

    if (enJsonFiles.length === 0) {
      log.warn("⚠️  No en.json files found in the current directory tree.");
      return;
    }

    log.info(
      `📁 Found ${enJsonFiles.length} translation files to process...\n`,
    );

    // Delete translation files
    let deletedCount = 0;
    for (const file of enJsonFiles) {
      if (deleteTranslationFile(file, languageCode)) {
        deletedCount++;
      }
    }

    log.info(
      `\n🎉 Successfully deleted ${deletedCount} translation files for ${languageCode}!`,
    );

    log.info("\n🔧 Removing language from translation system...");

    // Remove from allLanguages.js
    const removedFromAllLanguages = removeFromAllLanguages(languageCode);

    // Remove from constants.ts
    const removedFromConstants = removeFromConstants(languageCode);

    // Remove from native allLanguages.js
    const removedFromNative = removeFromNativeAllLanguages(languageCode);

    log.info("\n📋 Summary:");
    if (removedFromAllLanguages && removedFromConstants && removedFromNative) {
      log.info("✅ Language successfully removed from translation system!");
    } else {
      log.warn(
        "⚠️  Some files may not have contained the language or had issues.",
      );
    }

    log.info("\n🎯 Language deletion complete!");
    log.info(
      "Note: You may need to restart your development server for changes to take effect.",
    );
  } catch (error) {
    log.error(getErrorMessage(error));
    process.exit(1);
  }
};

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  deleteTranslationFile,
  removeFromAllLanguages,
  removeFromConstants,
  removeFromNativeAllLanguages,
};
