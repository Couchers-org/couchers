import { GrowthBook, GrowthBookProvider } from "@growthbook/growthbook-react";
import { isExperimentationEnabled } from "experimentation";
import { useAuthContext } from "features/auth/AuthProvider";
import { ReactNode, useEffect, useMemo } from "react";

export default function ExperimentationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { authState } = useAuthContext();

  const gb = useMemo(
    () =>
      new GrowthBook({
        apiHost: process.env.NEXT_PUBLIC_GROWTHBOOK_API_HOST,
        clientKey: process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY,
        enableDevMode: process.env.NEXT_PUBLIC_COUCHERS_ENV !== "prod",
      }),
    [],
  );

  useEffect(() => {
    if (isExperimentationEnabled()) {
      gb.init({ timeout: 2000 });
    }
    return () => {
      gb.destroy();
    };
  }, [gb]);

  useEffect(() => {
    gb.setAttributes({
      id: authState.userId?.toString() ?? undefined,
    });
  }, [gb, authState.userId]);

  return <GrowthBookProvider growthbook={gb}>{children}</GrowthBookProvider>;
}
