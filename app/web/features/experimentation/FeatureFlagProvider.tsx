import { configureCache, GrowthBook } from "@growthbook/growthbook";
import { GrowthBookProvider, useGrowthBook } from "@growthbook/growthbook-react";
import { useAuthContext } from "features/auth/AuthProvider";
import Sentry from "platform/sentry";
import { createContext, ReactNode, useContext, useEffect } from "react";
import { reportExposure } from "service/experiments";

import { useTargetingAttributes } from "./targetingAttributes";

const INIT_TIMEOUT_MS = 1500;
const REFRESH_INTERVAL_MS = 60 * 1000;
// Within this window, init serves the cached payload without a network fetch.
const CACHE_STALE_TTL_MS = 5 * 60 * 1000;

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

// Defaults to ready so components rendered without the provider (e.g. in tests) aren't blocked
const AttributesReadyContext = createContext(true);

export type FeatureFlagSnapshot = {
  targeting: Record<string, unknown>;
  values: Record<string, unknown>;
};

declare global {
  interface Window {
    readonly couchersFlags?: FeatureFlagSnapshot;
  }
}

export function getFeatureFlagSnapshot(): FeatureFlagSnapshot {
  const targeting = growthbook.getAttributes();
  const probe = new GrowthBook({ attributes: targeting });
  probe.initSync({ payload: growthbook.getDecryptedPayload() });
  return {
    targeting,
    values: Object.fromEntries(
      Object.keys(probe.getFeatures())
        .sort()
        .map((key) => [key, probe.evalFeature(key).value]),
    ),
  };
}

if (typeof window !== "undefined") {
  Object.defineProperty(window, "couchersFlags", { get: getFeatureFlagSnapshot, configurable: true });
}

export default function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const { authState } = useAuthContext();
  const { attributes, ready: attributesReady } = useTargetingAttributes(authState.userId);

  useEffect(() => {
    // Dev-only: when set, flags resolve from feature-flags.dev.json instead of GrowthBook,
    // mirroring the backend's FEATURE_FLAGS_FILE_OVERRIDE_PATH. Overridden flags return the file
    // value; unknown flags fall through to their in-code default. GrowthBook is never contacted in
    // this mode. The inline NODE_ENV check lets webpack compile the whole branch out of production
    // builds, keeping the file out of production bundles.
    if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_FEATURE_FLAGS_OVERRIDE === "1") {
      void import("feature-flags.dev.json").then((mod) => {
        const overrides = mod.default as Record<string, unknown>;
        // Avoid initSync. It is meant to be used as new GrowthBook(...).initSync(...),
        // so it assumes there are no users and doesn't notify them.
        // Hence React components can wait on useGrowthBook().ready forever.
        void growthbook.setPayload({
          features: Object.fromEntries(Object.entries(overrides).map(([key, value]) => [key, { defaultValue: value }])),
        });
      });
      return;
    }
    void growthbook.init({ timeout: INIT_TIMEOUT_MS });
    const id = setInterval(() => void growthbook.refreshFeatures(), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    growthbook.setAttributes(attributes);
  }, [attributes]);

  return (
    <GrowthBookProvider growthbook={growthbook}>
      <AttributesReadyContext value={attributesReady}>{children}</AttributesReadyContext>
    </GrowthBookProvider>
  );
}

/** Whether flags can be evaluated: the GrowthBook payload and the user's targeting attributes are loaded or timed out. */
export function useFeatureFlagsReady() {
  const growthbookReady = useGrowthBook().ready;
  const attributesReady = useContext(AttributesReadyContext);
  return growthbookReady && attributesReady;
}
