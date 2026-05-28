import * as Sentry from "@sentry/react-native";
import * as Updates from "expo-updates";

import {
  appVariant,
  nativeBuiltAt,
  nativeDebugVersion,
  nativeDisplayVersion,
  nativeGitHash,
  otaCreatedAt,
  otaDebugVersion,
  otaDisplayVersion,
  otaGitHash,
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
    // Native store-binary identity (fixed across OTAs)
    await Updates.setExtraParamAsync(
      "native-display-version",
      nativeDisplayVersion,
    );
    await Updates.setExtraParamAsync("native-debug-version", nativeDebugVersion);
    await Updates.setExtraParamAsync("native-git-hash", nativeGitHash);
    await Updates.setExtraParamAsync("native-built-at", nativeBuiltAt);

    // OTA bundle identity (varies per OTA)
    await Updates.setExtraParamAsync("ota-display-version", otaDisplayVersion);
    await Updates.setExtraParamAsync("ota-debug-version", otaDebugVersion);
    await Updates.setExtraParamAsync("ota-git-hash", otaGitHash);
    await Updates.setExtraParamAsync("ota-created-at", otaCreatedAt);
  })().catch((err) => Sentry.captureException(err));
}
