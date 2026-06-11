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

const enabled = appVariant === "production" || appVariant === "staging";

if (enabled) {
  // These params are set after the JS bundle loads, but expo-updates fires the
  // update check on load before JS runs — so each check carries the previous
  // launch's values (the first check after an OTA is stale, accurate after).
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
