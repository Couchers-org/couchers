import { GrowthBookProvider } from "@growthbook/growthbook-react";
import { ReactNode, useEffect } from "react";

import { useAuthContext } from "@/features/auth/AuthContext";

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
  const { userId } = useAuthContext();

  useEffect(() => {
    void loadFeatureFlags();
    return startFeatureFlagRefresh();
  }, []);

  useEffect(() => {
    growthbook.setAttributes(userId != null ? { id: userId.toString() } : {});
  }, [userId]);

  return (
    <GrowthBookProvider growthbook={growthbook}>{children}</GrowthBookProvider>
  );
}
