const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

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

// The production native build runs app.config.js on EAS's servers, which don't
// see our GitLab shell env (so DISPLAY_VERSION/DEBUG_VERSION are unset and the
// embedded version would fall back to "development"). The production-native CI
// job writes the computed values here before `eas build`, and EAS uploads the
// file with the project. Read order everywhere: env var > build-version.json >
// fallback. The file is in .fingerprintignore and only feeds `extra` (skipped via
// ExpoConfigExtraSection), so its presence never moves the runtimeVersion.
const buildVersion = (() => {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(__dirname, "build-version.json"), "utf-8"),
    );
  } catch {
    return {};
  }
})();

// This bundle's display version, matching the website footer. CI sets
// DISPLAY_VERSION (app/version + git rev-list count, e.g. v1.2.18410); local
// builds get "development" so they're never confused with a real release.
const getDisplayVersion = () =>
  process.env.DISPLAY_VERSION || buildVersion.displayVersion || "development";

// This bundle's debug version: {displayVersion}.{gitHash}.{gitCommitTime}, e.g.
// v1.2.18410.1156180a.20260528Z0533. CI composes it (DEBUG_VERSION); local
// builds reconstruct the same shape from local git. Baked into the JS bundle so
// each OTA bundle carries its own; the runtime appends the OTA suffix
// (-{fingerprint}-{assetId}-{createdAt}) in service/buildInfo.ts.
const getDebugVersion = () =>
  process.env.DEBUG_VERSION ||
  buildVersion.debugVersion ||
  `${getDisplayVersion()}.${git("rev-parse --short=8 HEAD")}.${git(
    "show -s --date=format-local:'%Y%m%dZ%H%M' --format=%cd HEAD",
  )}`;

const ICON_SETS = {
  default: {
    icon: "./assets/images/icon.png",
    ios: "./assets/images/icon_ios.png",
    adaptiveForeground: "./assets/images/adaptive_icon_foreground.png",
  },
  staging: {
    icon: "./assets/images/icon_staging.png",
    ios: "./assets/images/icon_ios_staging.png",
    adaptiveForeground: "./assets/images/adaptive_icon_foreground_staging.png",
  },
};

// Per-variant configuration — add a new variant by adding an entry here.
// `linkHost` is the https domain the app claims for universal/app links;
// null means no claim (the Dev Tool build routes via its custom scheme only, so
// it can't steal universal links from the staging app, which shares its backend).
// `webcredHost` is the passkey relying-party domain (webcredentials: associated
// domain). It's a native entitlement, so it can't be added over OTA — it's baked
// in now even though the backend WebAuthn endpoint and hosted AASA come later.
const VARIANTS = {
  production: {
    name: "Couchers",
    bundleIdentifier: "org.couchers.ios",
    androidPackage: "org.couchers.android",
    scheme: "couchers",
    iconSet: "default",
    linkHost: "couchers.org",
    webcredHost: "couchers.org",
  },
  staging: {
    name: "Couchers (Staging)",
    bundleIdentifier: "org.couchers.staging.ios",
    androidPackage: "org.couchers.staging.android",
    scheme: "couchers-staging",
    iconSet: "staging",
    linkHost: "next.couchershq.org",
    webcredHost: "couchershq.org",
  },
  devtool: {
    name: "Couchers Dev Tool",
    bundleIdentifier: "org.couchers.devtool.ios",
    androidPackage: "org.couchers.devtool.android",
    scheme: "couchers-devtool",
    iconSet: "staging",
    linkHost: null,
    webcredHost: null,
  },
};

const APP_VARIANT = process.env.APP_VARIANT || "devtool";
const variant = VARIANTS[APP_VARIANT] ?? VARIANTS.production;
const icons = ICON_SETS[variant.iconSet];

const associatedDomains = [
  variant.linkHost && `applinks:${variant.linkHost}`,
  variant.webcredHost && `webcredentials:${variant.webcredHost}`,
].filter(Boolean);

const intentFilters = variant.linkHost
  ? [
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: "https", host: variant.linkHost, pathPrefix: "/" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ]
  : [];

// Dev Tool branches load OTA through the dev launcher's deep-link load path
// (couchers-devtool://expo-development-client/?url=...), so no update URL is
// baked in and manifests are served unsigned over HTTPS.
//
// Staging points at our self-hosted OTA backend (cut 1: validating the Expo
// Updates protocol + native<->backend transport, unsigned).
//
// Production requires a code-signed manifest: the tools/ publish lambda signs
// each bundle with the private key, and this cert (its public half) lets the
// device reject anything not signed by it. keyid/alg must match the lambda's
// OTA_SIGNING_KEY_ID and rsa-v1_5-sha256.
const updates =
  APP_VARIANT === "devtool"
    ? { enabled: true }
    : APP_VARIANT === "staging"
      ? { url: "https://dev-api.couchershq.org/native/ota/manifest" }
      : {
          url: "https://api.couchers.org/native/ota/manifest",
          codeSigningCertificate: "./certs/certificate.pem",
          codeSigningMetadata: { keyid: "main", alg: "rsa-v1_5-sha256" },
        };

export default {
  name: variant.name,
  slug: "mobile",
  version: "1.1.20",
  orientation: "portrait",
  icon: icons.icon,
  scheme: variant.scheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  runtimeVersion: { policy: "fingerprint" },
  updates,
  ios: {
    supportsTablet: true,
    bundleIdentifier: variant.bundleIdentifier,
    icon: icons.ios,
    associatedDomains,
    // Location is when-in-use only (the expo-location plugin entry below drops the
    // "always" variants). Calendar strings + permissions come from the
    // expo-calendar plugin entry; expo-camera's camera string from expo-image-picker.
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSLocationWhenInUseUsageDescription:
        "Allow Couchers to access your location to search for users, events, and other activities near you",
    },
  },
  android: {
    edgeToEdgeEnabled: true,
    package: variant.androidPackage,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
    // CAMERA and location permissions are merged in from the expo-camera and
    // expo-location library manifests; calendar's READ/WRITE come from the
    // expo-calendar plugin. Only POST_NOTIFICATIONS needs declaring here.
    permissions: ["POST_NOTIFICATIONS"],
    adaptiveIcon: {
      foregroundImage: icons.adaptiveForeground,
      backgroundColor: "#E47701",
    },
    notification: {
      icon: "./assets/images/notification_icon.png",
      color: "#E47701",
    },
    intentFilters,
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-font",
    [
      "expo-build-properties",
      {
        ios: {
          enableUserScriptSandboxing: false,
        },
      },
    ],
    [
      "expo-splash-screen",
      {
        backgroundColor: "#E47701",
        image: "./assets/images/splash_light.png",
        imageWidth: 200,
        dark: {
          image: "./assets/images/splash_dark.png",
          backgroundColor: "#313539",
        },
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/images/notification_icon.png",
        color: "#E47701",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "Allow Couchers to access your photos to upload to your profile.",
        cameraPermission:
          "Allow Couchers to access your camera to take profile photos.",
        // expo-camera's manifest pulls in RECORD_AUDIO; we never record audio,
        // so block it (also keeps the mic permission off the Play listing).
        microphonePermission: false,
      },
    ],
    [
      "@sentry/react-native/expo",
      {
        url: "https://sentry.io/",
        project: "native",
        organization: "couchers",
      },
    ],
    "expo-web-browser",
    // faceIDPermission: false suppresses the plugin's default NSFaceIDUsageDescription —
    // we never use the requireAuthentication option, so no Face ID string is needed.
    ["expo-secure-store", { faceIDPermission: false }],
    "expo-localization",
    "expo-mail-composer",
    "expo-background-task",
    // expo-location/expo-camera plugins auto-apply (autolinked) with default props;
    // listing them explicitly lets us suppress what we don't use. Location: keep
    // when-in-use (string set in ios.infoPlist), drop the "always" variants.
    // Camera: no microphone (we never record audio).
    [
      "expo-location",
      {
        locationAlwaysPermission: false,
        locationAlwaysAndWhenInUsePermission: false,
      },
    ],
    ["expo-camera", { microphonePermission: false, recordAudioAndroid: false }],
    [
      "expo-calendar",
      { calendarPermission: "Add upcoming trips and events to your calendar" },
    ],
    "./plugins/withNativeBuildInfo",
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "fb4fc9aa-d8b2-45a5-82aa-be05e99b0413",
    },
    displayVersion: getDisplayVersion(),
    debugVersion: getDebugVersion(),
    appVariant: APP_VARIANT,
  },
  owner: "couchers-org",
};
