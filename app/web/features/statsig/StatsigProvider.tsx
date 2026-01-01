import {
  LogLevel,
  StatsigProvider as StatsigSDKProvider,
} from "@statsig/react-bindings";
import { isExperimentationEnabled } from "experimentation";
import { useAuthContext } from "features/auth/AuthProvider";
import { ReactNode } from "react";

export default function StatsigProvider({ children }: { children: ReactNode }) {
  const { authState } = useAuthContext();

  // If experimentation is disabled (no SDK key), just render children
  if (!isExperimentationEnabled()) {
    return <>{children}</>;
  }

  const user = {
    userID: authState.userId?.toString() ?? undefined,
  };

  return (
    <StatsigSDKProvider
      sdkKey={process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY!}
      user={user}
      options={{
        logLevel:
          process.env.NEXT_PUBLIC_COUCHERS_ENV === "prod"
            ? LogLevel.None
            : LogLevel.Debug,
      }}
    >
      {children}
    </StatsigSDKProvider>
  );
}
