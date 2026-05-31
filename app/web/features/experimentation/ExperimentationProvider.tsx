import { OpenFeatureProvider } from "@openfeature/react-sdk";
import { OpenFeature } from "@openfeature/web-sdk";
import { useAuthContext } from "features/auth/AuthProvider";
import { ReactNode, useEffect } from "react";

import { CouchersFlagProvider } from "./CouchersFlagProvider";

export default function ExperimentationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { authState } = useAuthContext();

  // Set the provider on the client only (it makes a network call on init, which can't run on the
  // server). Until it's ready, hooks return their in-code defaults.
  useEffect(() => {
    OpenFeature.setProvider(new CouchersFlagProvider());
  }, []);

  // The backend identifies the user from the session cookie; the targeting key just triggers a
  // re-evaluation when the user logs in or out.
  useEffect(() => {
    const userId = authState.userId;
    OpenFeature.setContext(
      userId != null ? { targetingKey: userId.toString() } : {},
    );
  }, [authState.userId]);

  return <OpenFeatureProvider>{children}</OpenFeatureProvider>;
}
