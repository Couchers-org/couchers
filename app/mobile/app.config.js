const { execSync } = require("child_process");

// Capture git hash at build time (8 chars)
const getGitHash = () => {
  try {
    return execSync("git rev-parse --short=8 HEAD", {
      encoding: "utf-8",
    }).trim();
  } catch {
    return "unknown";
  }
};

// The OTA bundle's display version. CI sets DISPLAY_VERSION (computed from
// app/version + git rev-list count, e.g. v1.2.18402); local builds get
// "development" so they're never confused with a real release.
const getOtaDisplayVersion = () => process.env.DISPLAY_VERSION || "development";

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
const VARIANTS = {
  production: {
    name: "Couchers",
    bundleIdentifier: "org.couchers.ios",
    androidPackage: "org.couchers.android",
    scheme: "couchers",
    iconSet: "default",
    linkHost: "couchers.org",
  },
  staging: {
    name: "Couchers (Staging)",
    bundleIdentifier: "org.couchers.staging.ios",
    androidPackage: "org.couchers.staging.android",
    scheme: "couchers-staging",
    iconSet: "staging",
    linkHost: "next.couchershq.org",
  },
  devtool: {
    name: "Couchers Dev Tool",
    bundleIdentifier: "org.couchers.devtool.ios",
    androidPackage: "org.couchers.devtool.android",
    scheme: "couchers-devtool",
    iconSet: "staging",
    linkHost: null,
  },
};

const APP_VARIANT = process.env.APP_VARIANT || "production";
const variant = VARIANTS[APP_VARIANT] ?? VARIANTS.production;
const icons = ICON_SETS[variant.iconSet];

const associatedDomains = variant.linkHost
  ? [`applinks:${variant.linkHost}`]
  : [];

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
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    edgeToEdgeEnabled: true,
    package: variant.androidPackage,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
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
    gitHash: getGitHash(),
    otaDisplayVersion: getOtaDisplayVersion(),
    appVariant: APP_VARIANT,
  },
  owner: "couchers-org",
};
