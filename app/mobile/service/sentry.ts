import * as Sentry from "@sentry/react-native";

import { getDefaultApiBaseUrl, getDefaultWebBaseUrl } from "@/config/urls";
import {
  appVariant,
  createdAt,
  embeddedDebugVersion,
  embeddedDisplayVersion,
  isEmbeddedLaunch,
  runningDebugVersion,
  runningDebugVersionOTA,
  runningDisplayVersion,
  runtimeVersion,
  updateId,
} from "@/service/buildInfo";
import {
  allCapabilities,
  capabilityPlatformVersion,
} from "@/service/platformCapabilities";

// The backend/web the build is wired to. Read the build defaults rather than
// the runtime getters, since Sentry inits before any dev URL override hydrates.
const apiBaseUrl = getDefaultApiBaseUrl();
const webBaseUrl = getDefaultWebBaseUrl();

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
        // Embedded store-binary identity (fixed across OTAs)
        embeddedDisplayVersion,
        embeddedDebugVersion,
        // Running bundle identity (varies per OTA)
        runningDisplayVersion,
        runningDebugVersion,
        runningDebugVersionOTA,
        runtimeVersion,
        capabilityPlatformVersion,
        launchSource: isEmbeddedLaunch ? "embedded" : "ota",
        // Backend/web wiring
        apiBaseUrl,
        webBaseUrl,
      },
      contexts: {
        config: {
          apiBaseUrl,
          webBaseUrl,
        },
        store_build: {
          displayVersion: embeddedDisplayVersion,
          debugVersion: embeddedDebugVersion,
        },
        ota: {
          displayVersion: runningDisplayVersion,
          debugVersion: runningDebugVersion,
          debugVersionOTA: runningDebugVersionOTA,
          updateId,
          runtimeVersion,
          isEmbeddedLaunch,
          createdAt,
        },
        platform_capabilities: {
          version: capabilityPlatformVersion,
          capabilities: allCapabilities,
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
