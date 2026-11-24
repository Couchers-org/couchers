import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sentry from "@sentry/react-native";
import { useEffect, useMemo, useState } from "react";

import { getFeatureFlagAttributes } from "@/service/experiments";

type Attributes = Record<string, unknown>;

const STORAGE_KEY = "featureFlagAttributes";
// Matches the GrowthBook init timeout: past this, flags go ahead with cached or fallback attributes
const FETCH_TIMEOUT_MS = 1500;

// Attributes carry the id of the session they were computed for; anything else is stale (e.g. from before a
// login or logout) and must not be used for this user
function isForUser(
  attributes: Attributes | undefined,
  userId: number | null,
): attributes is Attributes {
  return (
    attributes !== undefined &&
    (attributes.id ?? null) === (userId?.toString() ?? null)
  );
}

export function getTargetingAttributes(
  userId: number | null,
  attributes: Attributes | undefined,
): Attributes {
  if (isForUser(attributes, userId)) return attributes;
  return userId == null ? {} : { id: userId.toString() };
}

/**
 * GrowthBook targeting attributes for the current user, from the backend. Like the GrowthBook payload, they are
 * cached, so flags keep working when the backend is down: `ready` is immediate on a cache hit, and otherwise once
 * the fetch completes, fails or times out. Nothing is fetched until `enabled`, i.e. the auth state is known.
 */
export function useTargetingAttributes(
  userId: number | null,
  enabled: boolean,
) {
  const [attributes, setAttributes] = useState<Attributes>();
  const userKey = userId?.toString() ?? "";
  const [settledFor, setSettledFor] = useState<string>();

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((cached) => {
        if (cached) {
          setAttributes(
            (current) => current ?? (JSON.parse(cached) as Attributes),
          );
        }
      })
      .catch((e) => {
        Sentry.captureException(e);
      });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const timeout = setTimeout(() => setSettledFor(userKey), FETCH_TIMEOUT_MS);
    getFeatureFlagAttributes()
      .then((json) => {
        setAttributes(JSON.parse(json) as Attributes);
        return AsyncStorage.setItem(STORAGE_KEY, json);
      })
      .catch((e) => {
        Sentry.captureException(e);
      })
      .finally(() => {
        clearTimeout(timeout);
        setSettledFor(userKey);
      });
    return () => clearTimeout(timeout);
  }, [enabled, userKey]);

  return {
    attributes: useMemo(
      () => getTargetingAttributes(userId, attributes),
      [userId, attributes],
    ),
    ready: isForUser(attributes, userId) || settledFor === userKey,
  };
}
