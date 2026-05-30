// Stamps the native build's identity in two places, both fixed at native build
// time and unchanged by OTAs (so they always describe the *embedded* / app-store
// build, never whichever JS bundle an OTA later swapped in):
//
//   1. Info.plist (iOS) / <meta-data> (Android) under Couchers* keys, read back
//      in-app via the native-build-info module (e.g. the triple-tap debug toast).
//
//   2. The expo-updates request headers (EXUpdatesRequestHeaders in Expo.plist /
//      the requestHeaders meta-data on Android). expo-updates sends these on
//      every manifest request, natively, BEFORE any JS runs — so the backend
//      learns the embedded build's identity with no lag and no extra round trip
//      (unlike Updates.setExtraParamAsync, which only applies from the next
//      launch). Combined with the protocol's own Expo-Runtime-Version
//      (fingerprint) header, the backend can tell which store build a device is
//      on and how long ago it was built. We write these via the config plugin
//      (NOT app.config's updates.requestHeaders) on purpose: the fingerprint
//      hashes the Expo *config object*, so a value in updates.requestHeaders
//      shifts the fingerprint every build and breaks OTA, whereas a plugin write
//      to the generated plist/manifest is invisible to the fingerprint.
//
// Values are resolved at prebuild time:
//
//   * DISPLAY_VERSION  — the human-readable release version (e.g. v1.2.18410),
//                        matching the website footer. CI computes it from
//                        app/version + git rev-list count; local prebuilds fall
//                        back to "development".
//   * DEBUG_VERSION    — {displayVersion}.{gitHash}.{gitCommitTime}, e.g.
//                        v1.2.18410.1156180a.20260528Z0533. CI composes it;
//                        local prebuilds reconstruct the same shape from git.
//   * NATIVE_BUILT_AT  — env var, or the prebuild wall-clock time. The actual
//                        build timestamp (commit time lives inside DEBUG_VERSION).
//
// Resolved inside the plugin (not passed from app.config.js), so the resolved
// Expo config — and therefore the fingerprint runtimeVersion — stays stable
// across commits.

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const {
  withInfoPlist,
  withAndroidManifest,
  withExpoPlist,
  AndroidConfig,
} = require("@expo/config-plugins");

const DISPLAY_VERSION_KEY = "CouchersNativeDisplayVersion";
const DEBUG_VERSION_KEY = "CouchersNativeDebugVersion";

// expo-updates' Android request-headers meta-data key (a JSON-string map).
const ANDROID_REQUEST_HEADERS_KEY =
  "expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY";

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

// Written by the production-native CI job before `eas build`, since EAS evaluates
// this plugin on its servers without our GitLab shell env. Read order: env var >
// build-version.json > git fallback. In .fingerprintignore; the values it feeds
// only land in the (prebuild-generated, fingerprint-invisible) plist/manifest.
const buildVersion = (() => {
  try {
    return JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "..", "build-version.json"),
        "utf-8",
      ),
    );
  } catch {
    return {};
  }
})();

function resolveDisplayVersion() {
  return (
    process.env.DISPLAY_VERSION || buildVersion.displayVersion || "development"
  );
}

function resolveDebugVersion() {
  return (
    process.env.DEBUG_VERSION ||
    buildVersion.debugVersion ||
    `${resolveDisplayVersion()}.${git("rev-parse --short=8 HEAD")}.${git(
      "show -s --date=format-local:'%Y%m%dZ%H%M' --format=%cd HEAD",
    )}`
  );
}

function resolveBuiltAt() {
  return process.env.NATIVE_BUILT_AT || new Date().toISOString();
}

module.exports = function withNativeBuildInfo(config) {
  const displayVersion = resolveDisplayVersion();
  const debugVersion = resolveDebugVersion();
  const builtAt = resolveBuiltAt();

  // The embedded identity expo-updates sends on every manifest request.
  // store-version is the App Store / Play marketing version (config.version,
  // e.g. 1.1.20) — the namespace the stores and our backend's min-version gating
  // speak in. The store *build number* (CFBundleVersion / versionCode) is NOT
  // here: with appVersionSource "remote" it's assigned by EAS after prebuild, so
  // it isn't resolvable when this plugin runs; read it at runtime via
  // Constants.nativeBuildVersion (e.g. for Sentry) instead.
  const requestHeaders = {
    "couchers-embedded-display-version": displayVersion,
    "couchers-embedded-debug-version": debugVersion,
    "couchers-embedded-store-version": config.version ?? "unknown",
    "couchers-embedded-built-at": builtAt,
  };

  // 1a. iOS Info.plist (for the in-app native-build-info module)
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults[DISPLAY_VERSION_KEY] = displayVersion;
    cfg.modResults[DEBUG_VERSION_KEY] = debugVersion;
    return cfg;
  });

  // 1b. Android <meta-data> (for the in-app native-build-info module)
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

  // 2a. iOS update request headers (Expo.plist EXUpdatesRequestHeaders)
  config = withExpoPlist(config, (cfg) => {
    cfg.modResults.EXUpdatesRequestHeaders = {
      ...(cfg.modResults.EXUpdatesRequestHeaders || {}),
      ...requestHeaders,
    };
    return cfg;
  });

  // 2b. Android update request headers (JSON-string meta-data). Merge into any
  // existing value so we don't clobber headers another plugin set.
  config = withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(
      cfg.modResults,
    );
    const existing = app["meta-data"]?.find(
      (item) => item.$["android:name"] === ANDROID_REQUEST_HEADERS_KEY,
    )?.$["android:value"];
    const merged = {
      ...(existing ? JSON.parse(existing) : {}),
      ...requestHeaders,
    };
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      app,
      ANDROID_REQUEST_HEADERS_KEY,
      JSON.stringify(merged),
    );
    return cfg;
  });

  return config;
};
