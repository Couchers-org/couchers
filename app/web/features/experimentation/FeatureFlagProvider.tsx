import { GrowthBookProvider } from "@growthbook/growthbook-react";
import { useAuthContext } from "features/auth/AuthProvider";
import { ReactNode, useEffect } from "react";

import {
  growthbook,
  loadFeatureFlags,
  startFeatureFlagRefresh,
} from "./growthbook";

export default function FeatureFlagProvider({
  children,
}: {
  children: ReactNode;
}) {
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
    <GrowthBookProvider growthbook={growthbook}>{children}</GrowthBookProvider>
  );
}
