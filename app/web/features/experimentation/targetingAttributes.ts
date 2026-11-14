import Sentry from "platform/sentry";
import { useEffect, useMemo, useState } from "react";
import { getFeatureFlagAttributes } from "service/experiments";

type Attributes = Record<string, unknown>;

const STORAGE_KEY = "featureFlagAttributes";
// Matches the GrowthBook init timeout: past this, flags go ahead with cached or fallback attributes
const FETCH_TIMEOUT_MS = 1500;

function readCache(): Attributes | undefined {
  if (typeof window === "undefined") return undefined;
  const cached = localStorage.getItem(STORAGE_KEY);
  return cached ? (JSON.parse(cached) as Attributes) : undefined;
}

// Attributes carry the id of the session they were computed for; anything else is stale (e.g. from before a
// login or logout) and must not be used for this user
function isForUser(attributes: Attributes | undefined, userId: number | null): attributes is Attributes {
  return attributes !== undefined && (attributes.id ?? null) === (userId?.toString() ?? null);
}

export function getTargetingAttributes(userId: number | null, attributes: Attributes | undefined): Attributes {
  if (isForUser(attributes, userId)) return attributes;
  return userId == null ? {} : { id: userId.toString() };
}

/**
 * GrowthBook targeting attributes for the current user, from the backend. Like the GrowthBook payload, they are
 * cached, so flags keep working when the backend is down: `ready` is immediate on a cache hit, and otherwise once
 * the fetch completes, fails or times out.
 */
export function useTargetingAttributes(userId: number | null) {
  const [attributes, setAttributes] = useState(readCache);
  const userKey = userId?.toString() ?? "";
  const [settledFor, setSettledFor] = useState<string>();

  useEffect(() => {
    const timeout = setTimeout(() => setSettledFor(userKey), FETCH_TIMEOUT_MS);
    getFeatureFlagAttributes()
      .then((json) => {
        localStorage.setItem(STORAGE_KEY, json);
        setAttributes(JSON.parse(json) as Attributes);
      })
      .catch((e) => {
        Sentry.captureException(e, { tags: { component: "experimentation/targetingAttributes" } });
      })
      .finally(() => {
        clearTimeout(timeout);
        setSettledFor(userKey);
      });
    return () => clearTimeout(timeout);
  }, [userKey]);

  return {
    attributes: useMemo(() => getTargetingAttributes(userId, attributes), [userId, attributes]),
    ready: isForUser(attributes, userId) || settledFor === userKey,
  };
}
