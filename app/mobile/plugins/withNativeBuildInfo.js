// Stamps the native build's identity into Info.plist (iOS) and <meta-data> on
// <application> (Android), where native code can read it post-OTA. Values are
// resolved at prebuild time:
//
//   * DISPLAY_VERSION   — the human-readable release version (e.g. v1.2.18402);
//                         CI computes it from app/version + git rev-list count
//                         and exposes it as DISPLAY_VERSION env. Local prebuilds
//                         fall back to "development".
//   * NATIVE_GIT_HASH   — env var, or `git rev-parse --short=8 HEAD`, or "dev".
//   * NATIVE_BUILT_AT   — env var, or `new Date().toISOString()` at prebuild.
//
// Resolved inside the plugin (not passed from app.config.js), so the resolved
// Expo config — and therefore the fingerprint runtimeVersion — stays stable
// across commits. The substituted ios/ and android/ files only exist post-
// prebuild, after the fingerprint is computed.

const { execSync } = require("child_process");

const {
  withInfoPlist,
  withAndroidManifest,
  AndroidConfig,
} = require("@expo/config-plugins");

const DISPLAY_VERSION_KEY = "CouchersNativeDisplayVersion";
const GIT_HASH_KEY = "CouchersNativeGitHash";
const BUILT_AT_KEY = "CouchersNativeBuiltAt";

function resolveDisplayVersion() {
  return process.env.DISPLAY_VERSION || "development";
}

function resolveGitHash() {
  if (process.env.NATIVE_GIT_HASH) {
    return process.env.NATIVE_GIT_HASH;
  }
  try {
    return execSync("git rev-parse --short=8 HEAD", {
      encoding: "utf-8",
    }).trim();
  } catch {
    return "dev";
  }
}

function resolveBuiltAt() {
  return process.env.NATIVE_BUILT_AT || new Date().toISOString();
}

module.exports = function withNativeBuildInfo(config) {
  const displayVersion = resolveDisplayVersion();
  const gitHash = resolveGitHash();
  const builtAt = resolveBuiltAt();

  config = withInfoPlist(config, (cfg) => {
    cfg.modResults[DISPLAY_VERSION_KEY] = displayVersion;
    cfg.modResults[GIT_HASH_KEY] = gitHash;
    cfg.modResults[BUILT_AT_KEY] = builtAt;
    return cfg;
  });

  config = withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(
      cfg.modResults,
    );
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      app,
      DISPLAY_VERSION_KEY,
      displayVersion,
    );
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      app,
      GIT_HASH_KEY,
      gitHash,
    );
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      app,
      BUILT_AT_KEY,
      builtAt,
    );
    return cfg;
  });

  return config;
};
