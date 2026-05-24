import { useAuthContext } from "features/auth/AuthProvider";
import { useEffect } from "react";
import { setBaseUrlOverride } from "service/notifications";

// Refresh well before the 15 min server-side TTL so the override stays active while testing.
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

/**
 * On preview/dev builds, tell the (shared) backend to point the links it generates - notifications, emails,
 * redirect URLs - at this frontend's origin, so a developer testing against the stage backend gets links back
 * to whatever preview they're on rather than the configured BASE_URL. The RPC is gated server-side by
 * ENABLE_DEV_APIS, so this is a no-op in prod (and we also skip it here).
 */
export function BaseUrlOverrideSync() {
  const { authState } = useAuthContext();
  const { authenticated } = authState;

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_COUCHERS_ENV === "prod" || !authenticated) {
      return;
    }

    const sync = () => {
      // ignore failures (e.g. dev APIs disabled server-side)
      setBaseUrlOverride(window.location.origin).catch(() => {});
    };

    sync();
    const interval = setInterval(sync, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [authenticated]);

  return null;
}
