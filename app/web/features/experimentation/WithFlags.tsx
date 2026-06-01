import {
  FeaturesReady,
  GrowthBookProvider,
} from "@growthbook/growthbook-react";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { useAuthContext } from "features/auth/AuthProvider";
import { ReactNode, useEffect } from "react";

import {
  growthbook,
  loadFeatureFlags,
  startFeatureFlagRefresh,
} from "./growthbook";

// Provides the GrowthBook SDK and waits for the first flag load before rendering its subtree, so
// flag-driven UI never flickers. Currently mounted around the only flag-consuming page; promoting it
// to the app root (in _app.tsx) is the intended next step once this is proven in prod.
export default function WithFlags({ children }: { children: ReactNode }) {
  const { authState } = useAuthContext();

  useEffect(() => {
    void loadFeatureFlags();
    return startFeatureFlagRefresh();
  }, []);

  useEffect(() => {
    const userId = authState.userId;
    growthbook.setAttributes(userId != null ? { id: userId.toString() } : {});
  }, [authState.userId]);

  return (
    <GrowthBookProvider growthbook={growthbook}>
      <FeaturesReady fallback={<CenteredSpinner minHeight="50vh" />}>
        {children}
      </FeaturesReady>
    </GrowthBookProvider>
  );
}
