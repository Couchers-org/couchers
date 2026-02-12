export default {
  name: "Couchers",
  slug: "mobile",
  version: "1.1.9",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "couchers",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "org.couchers.ios",
    icon: "./assets/images/icon_ios.png",
    associatedDomains: [
      "applinks:couchers.org",
      "applinks:next.couchershq.org",
    ],
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    edgeToEdgeEnabled: true,
    package: "org.couchers.android",
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
    permissions: ["POST_NOTIFICATIONS"],
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive_icon_foreground.png",
      backgroundColor: "#E47701",
    },
    notification: {
      icon: "./assets/images/notification_icon.png",
      color: "#E47701",
    },
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "couchers.org",
            pathPrefix: "/",
          },
          {
            scheme: "https",
            host: "next.couchershq.org",
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
  },
  owner: "couchers-org",
};
