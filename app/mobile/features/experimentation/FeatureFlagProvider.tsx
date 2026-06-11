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
