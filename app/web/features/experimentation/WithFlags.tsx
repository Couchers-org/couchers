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
// flag-driven UI never flickers. Mounted at the app root (in _app.tsx) so every page sees flags.
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
