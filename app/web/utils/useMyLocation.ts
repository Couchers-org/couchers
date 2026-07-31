import { useTranslation } from "next-i18next";
import Sentry from "platform/sentry";
import { useCallback, useRef, useState } from "react";
import type { GeocodeResult } from "utils/hooks";
import { reverse, toPeliasLanguage } from "utils/pelias";
import { markGeolocationGranted } from "utils/useLocationBias";

/**
 * LOC-4: the explicit "use my location" action — ask for the device position, then
 * reverse-geocode it into the same `GeocodeResult` shape forward search produces.
 *
 * The deliberate counterpart to LOC-3's silent bias ([useLocationBias]): here the
 * permission prompt is expected, because the user asked for it, and every failure
 * mode gets a message. It never blocks manual entry — on any error the caller's
 * field stays exactly as editable as it was, which is this story's acceptance note.
 *
 * Whatever the provider returns is accepted, including coarse (`county`,
 * `localadmin`) results in sparse areas and `ocean` at sea — the point the user is
 * standing on is the answer, and Pelias's own ~1km coarse fallback covers the
 * "GPS in a desert" case. Only a genuinely empty response has nothing to fill in.
 */

// The GPS fix itself. Longer timeout than LOC-3's passive read: the user is
// waiting on a spinner and expects a real answer, not a best-effort skip.
const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 60_000,
  timeout: 15_000,
};

export interface UseMyLocationOptions {
  // Fill a city-level field: an address or venue at the user's position collapses
  // to its containing city (the city name, not the street), with that city's bbox
  // and centre.
  // Destination search looks for hosts in a city, not on a street — and the
  // street number is not returned anyway, so a precise result would be a worse
  // answer, not a more useful one. Leave unset for address fields.
  preferCity?: boolean;
}

export interface UseMyLocationResult {
  // Ask for the position and resolve it. Resolves to the place, or undefined if
  // anything went wrong (in which case `error` holds a translated message).
  getMyLocation: () => Promise<GeocodeResult | undefined>;
  isLoading: boolean;
  error: string | undefined;
  reset: () => void;
}

export default function useMyLocation({
  preferCity = false,
}: UseMyLocationOptions = {}): UseMyLocationResult {
  const { t, i18n } = useTranslation("global");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  // Ignore a slow in-flight lookup once a newer click supersedes it.
  const latestRequestIdRef = useRef(0);

  const reset = useCallback(() => {
    setError(undefined);
  }, []);

  const getMyLocation = useCallback(async () => {
    const requestId = ++latestRequestIdRef.current;
    const isStale = () => requestId !== latestRequestIdRef.current;

    setError(undefined);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError(t("use_my_location.unsupported"));
      return undefined;
    }

    setIsLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            GEOLOCATION_OPTIONS,
          );
        },
      );

      if (isStale()) {
        return undefined;
      }
      // Lets LOC-3's bias work on browsers that can't report permission state.
      markGeolocationGranted();

      const { results } = await reverse(
        position.coords.latitude,
        position.coords.longitude,
        { language: toPeliasLanguage(i18n.language), preferCity },
      );

      if (isStale()) {
        return undefined;
      }
      if (results.length === 0) {
        setError(t("use_my_location.no_address"));
        return undefined;
      }
      return results[0];
    } catch (caught) {
      if (isStale()) {
        return undefined;
      }
      // GeolocationPositionError is not an Error, so it is matched by shape.
      if (
        caught &&
        typeof caught === "object" &&
        "code" in caught &&
        typeof (caught as GeolocationPositionError).code === "number"
      ) {
        const { code } = caught as GeolocationPositionError;
        setError(
          code === 1 /* PERMISSION_DENIED */
            ? t("use_my_location.permission_denied")
            : t("use_my_location.position_unavailable"),
        );
        return undefined;
      }
      // A provider/network failure: report it, and tell the user to type instead.
      Sentry.captureException(caught, { tags: { hook: "useMyLocation" } });
      setError(t("use_my_location.lookup_failed"));
      return undefined;
    } finally {
      if (!isStale()) {
        setIsLoading(false);
      }
    }
  }, [i18n.language, preferCity, t]);

  return { getMyLocation, isLoading, error, reset };
}
