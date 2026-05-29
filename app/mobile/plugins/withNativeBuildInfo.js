// Stamps the native build's identity into Info.plist (iOS) and <meta-data> on
// <application> (Android), where native code can read it post-OTA. This is the
// *embedded* bundle's identity — fixed at native build time and unchanged by
// OTAs, unlike Constants.expoConfig.extra, which reflects whichever JS bundle
// is currently running. Values are resolved at prebuild time:
//
//   * DISPLAY_VERSION  — the human-readable release version (e.g. v1.2.18410),
//                        matching the website footer. CI computes it from
//                        app/version + git rev-list count; local prebuilds fall
//                        back to "development".
//   * DEBUG_VERSION    — {displayVersion}.{gitHash}.{gitCommitTime}, e.g.
//                        v1.2.18410.1156180a.20260528Z0533. CI composes it;
//                        local prebuilds reconstruct the same shape from git.
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
const DEBUG_VERSION_KEY = "CouchersNativeDebugVersion";

const git = (cmd) => {
  try {
    return execSync(`git ${cmd}`, {
      encoding: "utf-8",
      env: { ...process.env, TZ: "UTC" },
    }).trim();
  } catch {
    return "unknown";
  }
};

function resolveDisplayVersion() {
  return process.env.DISPLAY_VERSION || "development";
}

function resolveDebugVersion() {
  return (
    process.env.DEBUG_VERSION ||
    `${resolveDisplayVersion()}.${git("rev-parse --short=8 HEAD")}.${git(
      "show -s --date=format-local:'%Y%m%dZ%H%M' --format=%cd HEAD",
    )}`
  );
}

module.exports = function withNativeBuildInfo(config) {
  const displayVersion = resolveDisplayVersion();
  const debugVersion = resolveDebugVersion();

  config = withInfoPlist(config, (cfg) => {
    cfg.modResults[DISPLAY_VERSION_KEY] = displayVersion;
    cfg.modResults[DEBUG_VERSION_KEY] = debugVersion;
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
      DEBUG_VERSION_KEY,
      debugVersion,
    );
    return cfg;
  });

  return config;
};
