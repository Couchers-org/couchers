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

// Determine app variant from environment variable
const APP_VARIANT = process.env.APP_VARIANT || "production";
const IS_STAGING = APP_VARIANT === "staging";

// Helper functions for dynamic configuration
const getAppName = () => {
  if (IS_STAGING) {
    return "Couchers (Staging)";
  }
  return "Couchers";
};

const getBundleIdentifier = () => {
  if (IS_STAGING) {
    return "org.couchers.staging.ios";
  }
  return "org.couchers.ios";
};

const getAndroidPackage = () => {
  if (IS_STAGING) {
    return "org.couchers.staging.android";
  }
  return "org.couchers.android";
};

const getAppScheme = () => {
  if (IS_STAGING) {
    return "couchers-staging";
  }
  return "couchers";
};

const getIcon = () => {
  if (IS_STAGING) {
    return "./assets/images/icon_staging.png";
  }
  return "./assets/images/icon.png";
};

const getIosIcon = () => {
  if (IS_STAGING) {
    return "./assets/images/icon_ios_staging.png";
  }
  return "./assets/images/icon_ios.png";
};

export default {
  name: getAppName(),
  slug: "mobile",
  version: "1.1.18",
  orientation: "portrait",
  icon: getIcon(),
  scheme: getAppScheme(),
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: getBundleIdentifier(),
    icon: getIosIcon(),
    associatedDomains: IS_STAGING
      ? ["applinks:next.couchershq.org"]
      : ["applinks:couchers.org"],
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    edgeToEdgeEnabled: true,
    package: getAndroidPackage(),
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
    permissions: ["POST_NOTIFICATIONS"],
    adaptiveIcon: {
      foregroundImage: IS_STAGING
        ? "./assets/images/adaptive_icon_foreground_staging.png"
        : "./assets/images/adaptive_icon_foreground.png",
      backgroundColor: "#E47701",
    },
    notification: {
      icon: "./assets/images/notification_icon.png",
      color: "#E47701",
    },
    intentFilters: IS_STAGING
      ? [
          {
            action: "VIEW",
            autoVerify: true,
            data: [
              {
                scheme: "https",
                host: "next.couchershq.org",
                pathPrefix: "/",
              },
            ],
            category: ["BROWSABLE", "DEFAULT"],
          },
        ]
      : [
          {
            action: "VIEW",
            autoVerify: true,
            data: [
              {
                scheme: "https",
                host: "couchers.org",
                pathPrefix: "/",
              },
            ],
            category: ["BROWSABLE", "DEFAULT"],
          },
        ],
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
  },
  owner: "couchers-org",
};
