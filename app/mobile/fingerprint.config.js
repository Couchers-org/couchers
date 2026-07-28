module.exports = {
  sourceSkips: [
    // no native-affecting build scripts, so an npm script shouldn't rebuild
    "PackageJsonScriptsAll",
    // app.config.js injects per-commit versions into `extra`; nothing native
    "ExpoConfigExtraSection",
    // a version/build-number bump shouldn't break OTA continuity
    "ExpoConfigVersions",
    // .gitignore contents never affect the native binary
    "GitIgnore",
  ],
};
