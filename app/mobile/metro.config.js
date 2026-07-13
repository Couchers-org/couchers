const fs = require("fs");
const path = require("path");

const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

// the dev feature-flag override file is shared with web, one level up; Metro crashes
// on nonexistent watchFolders, so skip it in contexts that don't check out the full repo
const featureFlagsDir = path.resolve(__dirname, "../feature-flags");
if (fs.existsSync(featureFlagsDir)) {
  config.watchFolders = [...(config.watchFolders ?? []), featureFlagsDir];
}

module.exports = config;
