import { GrowthBookProvider } from "@growthbook/growthbook-react";
import { ReactNode, useEffect } from "react";

import { useAuthContext } from "@/features/auth/AuthContext";

import { growthbook, loadFeatureFlags } from "./growthbook";

export default function FeatureFlagProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = useAuthContext();

  useEffect(() => {
    void loadFeatureFlags();
  }, []);

  useEffect(() => {
    growthbook.setAttributes(userId != null ? { id: userId.toString() } : {});
  }, [userId]);

  return (
    <GrowthBookProvider growthbook={growthbook}>{children}</GrowthBookProvider>
  );
}
