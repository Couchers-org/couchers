import { useCallback, useEffect, useState } from "react";
import { couchersGooglePlayURL } from "routes";

import { logEvent } from "./eventCollector";
import { HANDOFF_PARAM } from "./handoff";
import { randomToken } from "./searchAttribution";

export function useGooglePlayLink(): { href: string; onClick: () => void } {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => setToken(randomToken()), []);

  const onClick = useCallback(() => {
    if (token) logEvent("handoff.created", { token, kind: "google_play" });
  }, [token]);

  const href = token
    ? `${couchersGooglePlayURL}&referrer=${encodeURIComponent(`${HANDOFF_PARAM}=${token}`)}`
    : couchersGooglePlayURL;

  return { href, onClick };
}
