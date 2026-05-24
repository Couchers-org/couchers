import { useEffect } from "react";

import { useAuthContext } from "@/features/auth/AuthContext";
import { setBaseUrlOverride } from "@/service/notifications";

// Refresh well before the 15 min server-side TTL so the override stays active while testing.
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

/**
 * On preview/dev builds, tell the (shared) backend to point the links it generates - notifications, emails,
 * redirect URLs - at the web frontend this app wraps (EXPO_PUBLIC_WEB_BASE_URL), so push notifications deep-link
 * back to the right place when testing against the stage backend. Gated server-side by ENABLE_DEV_APIS, so this
 * is a no-op in prod (and we also skip it here).
 */
export function useSetBaseUrlOverride() {
  const { authenticated } = useAuthContext();

  useEffect(() => {
    const webBaseUrl = process.env.EXPO_PUBLIC_WEB_BASE_URL;
    if (
      process.env.EXPO_PUBLIC_COUCHERS_ENV === "prod" ||
      !authenticated ||
      !webBaseUrl
    ) {
      return;
    }

    const sync = () => {
      // ignore failures (e.g. dev APIs disabled server-side)
      setBaseUrlOverride(webBaseUrl).catch(() => {});
    };

    sync();
    const interval = setInterval(sync, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [authenticated]);
}
