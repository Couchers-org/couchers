import { configureCache, GrowthBook } from "@growthbook/growthbook";
import { GrowthBookProvider } from "@growthbook/growthbook-react";
import featureFlagOverrides from "feature-flags.dev.json";
import { useAuthContext } from "features/auth/AuthProvider";
import Sentry from "platform/sentry";
import { ReactNode, useEffect } from "react";
import { reportExposure } from "service/experiments";

const INIT_TIMEOUT_MS = 1500;
const REFRESH_INTERVAL_MS = 60 * 1000;
// Within this window, init serves the cached payload without a network fetch.
const CACHE_STALE_TTL_MS = 5 * 60 * 1000;

// Dev-only: when set, flags resolve from feature-flags.dev.json instead of GrowthBook, mirroring the
// backend's FEATURE_FLAGS_FILE_OVERRIDE_PATH. Overridden flags return the file value; unknown flags
// fall through to their in-code default. GrowthBook is never contacted in this mode.
const useFeatureFlagOverrides =
  process.env.NEXT_PUBLIC_FEATURE_FLAGS_OVERRIDE === "1";

configureCache({ staleTTL: CACHE_STALE_TTL_MS });

const growthbook = new GrowthBook({
  apiHost: process.env.NEXT_PUBLIC_GROWTHBOOK_API_HOST,
  clientKey: process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY,
  enableDevMode: process.env.NEXT_PUBLIC_COUCHERS_ENV !== "prod",
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
  const { authState } = useAuthContext();

  useEffect(() => {
    if (useFeatureFlagOverrides) {
      growthbook.setForcedFeatures(
        new Map(Object.entries(featureFlagOverrides)),
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
    const userId = authState.userId;
    growthbook.setAttributes(userId != null ? { id: userId.toString() } : {});
  }, [authState.userId]);

  return (
    <GrowthBookProvider growthbook={growthbook}>{children}</GrowthBookProvider>
  );
}
