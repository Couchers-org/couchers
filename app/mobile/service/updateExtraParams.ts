import * as Sentry from "@sentry/react-native";
import * as Updates from "expo-updates";

import {
  appVariant,
  embeddedDebugVersion,
  embeddedDisplayVersion,
  runningDebugVersion,
  runningDebugVersionOTA,
  runningDisplayVersion,
} from "@/service/buildInfo";

// Stamp the running bundle's identity into the manifest request via the
// Expo-Extra-Params header (Updates.setExtraParamAsync persists natively and
// the native client serializes the dictionary on every update check). This is
// the protocol's intended escape hatch for human-readable client identifiers —
// the standard expo-current-update-id / expo-runtime-version headers are
// opaque UUIDs / fingerprint hashes by design.
//
// Steady-state accuracy: a bundle sets its own values on first launch, so
// every later check reports them. The only stale check is the very first
// launch after an OTA applies, because expo-updates fires the check before
// JS runs setExtraParamAsync (checkAutomatically=ON_LOAD); from the next
// launch onward it's accurate.

// Only the store-distributed staging and production apps talk to the OTA
// manifest server. The dev tool loads bundles via the dev-launcher deep link
// and local dev has no manifest server, so setting params there is a no-op
// at best.
const enabled = appVariant === "production" || appVariant === "staging";

if (enabled) {
  (async () => {
    // Embedded store-binary identity (fixed across OTAs)
    await Updates.setExtraParamAsync(
      "embedded-display-version",
      embeddedDisplayVersion,
    );
    await Updates.setExtraParamAsync(
      "embedded-debug-version",
      embeddedDebugVersion,
    );

    // Running bundle identity (varies per OTA)
    await Updates.setExtraParamAsync(
      "running-display-version",
      runningDisplayVersion,
    );
    await Updates.setExtraParamAsync(
      "running-debug-version",
      runningDebugVersion,
    );
    await Updates.setExtraParamAsync(
      "running-debug-version-ota",
      runningDebugVersionOTA,
    );
  })().catch((err) => Sentry.captureException(err));
}
