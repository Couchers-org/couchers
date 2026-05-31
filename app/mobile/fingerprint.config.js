// @expo/fingerprint hashes the resolved Expo config, including `extra`. Our
// app.config.js injects the git commit hash into `extra.gitHash`, so without
// this skip every commit produced a unique runtimeVersion and an OTA update
// could never match an already-installed build. Nothing under `extra` (router,
// eas, gitHash) affects the native binary, so excluding it keeps the fingerprint
// stable across commits while still rebuilding when real native inputs change.
// The default package.json script skip is preserved.
module.exports = {
  sourceSkips: [
    "PackageJsonAndroidAndIosScriptsIfNotContainRun",
    "ExpoConfigExtraSection",
  ],
};
