import {
  configureCache,
  GrowthBook,
  setPolyfills,
} from "@growthbook/growthbook";
import { GrowthBookProvider } from "@growthbook/growthbook-react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sentry from "@sentry/react-native";
import { ReactNode, useEffect } from "react";

import { useAuthContext } from "@/features/auth/AuthContext";
import { reportExposure } from "@/service/experiments";

const INIT_TIMEOUT_MS = 1500;
const REFRESH_INTERVAL_MS = 60 * 1000;
// Within this window, init serves the cached payload without a network fetch.
const CACHE_STALE_TTL_MS = 5 * 60 * 1000;

configureCache({ staleTTL: CACHE_STALE_TTL_MS });

setPolyfills({
  localStorage: {
    getItem: async (key) => {
      const v = await AsyncStorage.getItem(key);
      return v != null ? JSON.parse(v) : null;
    },
    setItem: async (key, value) => {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    },
  },
});

const growthbook = new GrowthBook({
  apiHost: process.env.EXPO_PUBLIC_GROWTHBOOK_API_HOST,
  clientKey: process.env.EXPO_PUBLIC_GROWTHBOOK_CLIENT_KEY,
  trackingCallback: (experiment, result) => {
    return reportExposure({
      experimentKey: experiment.key,
      experimentName: experiment.name ?? "",
      variationId: result.variationId,
      variationKey: result.key,
      variationName: result.name ?? "",
      hashAttribute: result.hashAttribute,
      hashValue: result.hashValue,
      featureId: result.featureId ?? "",
      inExperiment: result.inExperiment,
      bucket: result.bucket,
      hashUsed: result.hashUsed,
      stickyBucketUsed: result.stickyBucketUsed,
    }).catch((e) => {
      Sentry.captureException(e);
    });
  },
});

export default function FeatureFlagProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = useAuthContext();

  useEffect(() => {
    // Dev-only: when set, flags resolve from the shared ../feature-flags/feature-flags.dev.json
    // instead of GrowthBook, mirroring web and the backend's FEATURE_FLAGS_FILE_OVERRIDE_PATH.
    // Overridden flags return the file value; unknown flags fall through to their in-code default.
    // GrowthBook is never contacted in this mode. The __DEV__ check lets Metro compile the whole
    // branch out of release bundles.
    if (__DEV__ && process.env.EXPO_PUBLIC_FEATURE_FLAGS_OVERRIDE === "1") {
      void import("../../../feature-flags/feature-flags.dev.json").then(
        (mod) => {
          const overrides = (mod.default ?? mod) as Record<string, boolean>;
          growthbook.setForcedFeatures(new Map(Object.entries(overrides)));
        },
      );
      return;
    }
    void growthbook.init({ timeout: INIT_TIMEOUT_MS });
    const id = setInterval(
      () => void growthbook.refreshFeatures(),
      REFRESH_INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    growthbook.setAttributes(userId != null ? { id: userId.toString() } : {});
  }, [userId]);

  return (
    <GrowthBookProvider growthbook={growthbook}>{children}</GrowthBookProvider>
  );
}
