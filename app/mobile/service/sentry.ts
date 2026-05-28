import * as Sentry from "@sentry/react-native";
import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Updates from "expo-updates";

import { getDefaultApiBaseUrl, getDefaultWebBaseUrl } from "@/config/urls";

const extra = Constants.expoConfig?.extra as
  | { gitHash?: string; appVariant?: string }
  | undefined;
const gitHash = extra?.gitHash ?? "unknown";
const appVariant = extra?.appVariant ?? "unknown";
// The backend/web the build is wired to. Read the build defaults rather than
// the runtime getters, since Sentry inits before any dev URL override hydrates.
const apiBaseUrl = getDefaultApiBaseUrl();
const webBaseUrl = getDefaultWebBaseUrl();
// The native binary downloaded from the App Store / Play Store. This stays
// fixed across OTA updates, unlike Constants.expoConfig.version which is read
// from the (possibly OTA-updated) JS bundle.
const nativeAppVersion = Application.nativeApplicationVersion ?? "unknown";
const nativeBuildVersion = Application.nativeBuildVersion ?? "unknown";

// Only report from the store-distributed staging and production apps. The dev
// tool (a dev client) and local dev builds would otherwise pollute the project
// with noise from in-progress work.
const sentryEnabled = appVariant === "production" || appVariant === "staging";

if (sentryEnabled) {
  Sentry.init({
    dsn: "https://7de06aa8cca6dacc9620667dd84a0d01@o782870.ingest.us.sentry.io/4507718344704000",

    environment:
      process.env.EXPO_PUBLIC_COUCHERS_ENV ??
      process.env.NEXT_PUBLIC_COUCHERS_ENV ??
      "dev",
    // release/dist are intentionally left unset so the @sentry/react-native
    // Expo integration derives them from the native build and OTA update,
    // matching the values its source-map upload uses. The store-binary and OTA
    // identities below are surfaced as tags/contexts (which don't affect
    // symbolication) for searching and filtering.
    initialScope: {
      tags: {
        appVariant,
        gitHash,
        nativeAppVersion,
        nativeBuildVersion,
        apiBaseUrl,
        webBaseUrl,
        runtimeVersion: Updates.runtimeVersion ?? "unknown",
        updateChannel: Updates.channel ?? "none",
        launchSource: Updates.isEmbeddedLaunch ? "embedded" : "ota",
      },
      contexts: {
        config: {
          apiBaseUrl,
          webBaseUrl,
        },
        store_build: {
          nativeApplicationVersion: nativeAppVersion,
          nativeBuildVersion,
          gitHash,
        },
        ota: {
          updateId: Updates.updateId ?? "none",
          channel: Updates.channel ?? "none",
          runtimeVersion: Updates.runtimeVersion ?? "unknown",
          isEmbeddedLaunch: Updates.isEmbeddedLaunch,
          createdAt: Updates.createdAt?.toISOString() ?? "unknown",
        },
      },
    },

    // Adds more context data to events (IP address, cookies, user, etc.)
    // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
    sendDefaultPii: true,

    // Enable Logs
    enableLogs: true,

    // Configure Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [
      Sentry.mobileReplayIntegration(),
      Sentry.feedbackIntegration(),
    ],
  });
}
