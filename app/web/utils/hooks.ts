import { Coordinates } from "features/search/utils/constants";
import { LngLat } from "maplibre-gl";
import { useRouter } from "next/router";
import Sentry from "platform/sentry";
import { Dispatch, MutableRefObject, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { service } from "service";
import {
  GeocodeProvider,
  geocodeSearch,
  initialProvider,
  isOutageError,
} from "utils/geocode";
import useLocationBias from "utils/useLocationBias";

/**
 * @deprecated use useIsClient instead. This pattern should only be used as a last resort
 * (e.g. to avoid hydration errors) as in most cases, render logic should not depend on the client being mounted.
 */
function useIsMounted() {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
}

function useSafeState<State>(
  isMounted: MutableRefObject<boolean>,
  initialState: State | (() => State),
): [State, Dispatch<SetStateAction<State>>] {
  const [state, setState] = useState(initialState);

  const safeSetState = useCallback(
    (newState: SetStateAction<State>) => {
      if (isMounted.current) {
        setState(newState);
      }
    },
    [isMounted],
  );

  return [state, safeSetState];
}

function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return isClient;
}

export interface GeocodeResult {
  // Stable provider id (Pelias `gid`). Consumed by the storage stories
  // (LOC-6/LOC-12); the homepage widget only needs the label + bbox.
  id?: string;
  name: string;
  simplifiedName: string;
  location: LngLat;
  bbox: Coordinates;
  isRegion?: boolean;
}

/**
 * Forward-geocoding autocomplete backed by Geocode.earth (Pelias Cloud), with a
 * legacy Nominatim fallback for Geocode.earth outages (see `utils/geocode.ts`).
 *
 * `query` is safe to call on every (debounced) keystroke: it aborts any
 * in-flight request and ignores stale responses so only the latest query's
 * results are surfaced. Results are localized via the active `i18n.language`
 * passed to the provider.
 *
 * `preferCity` (homepage destination search) enables soft city ranking, label
 * collapse to locality, parent-area bbox, and dedupe by display string. Other
 * surfaces leave precise venue/address hits alone for address / event venue use.
 *
 * The returned `provider` is sticky for the lifetime of the hook: once a query
 * has fallen back to Nominatim it stays there until remount, so the widget's UI
 * does not flip back and forth if Geocode.earth recovers intermittently.
 * Consumers driving an as-you-type UI MUST switch to submit-on-demand while
 * `provider === "nominatim"`.
 *
 * `allowFallback` is required: pass `false` on any surface that persists the
 * chosen location requiring a gid, since fallback results carry no Pelias `gid`.
 * In that case,  it surfaces `isProviderUnavailable` on an outage instead of degraded
 * results, and its `provider` never leaves `"pelias"`.
 *
 * `biasToUserLocation` (LOC-3) ranks results nearer the user's approximate
 * location higher, when the browser will give it to us without a prompt (see
 * `utils/useLocationBias.ts`). It is a soft signal only — distant places are still
 * returned, and searches run unbiased whenever no position is available.
 */
const useGeocodeQuery = (options: {
  allowFallback: boolean;
  preferCity?: boolean;
  biasToUserLocation?: boolean;
}) => {
  const { allowFallback } = options;
  const preferCity = options.preferCity ?? false;
  const focusRef = useLocationBias(options.biasToUserLocation ?? false);
  const { i18n } = useTranslation();
  const isMounted = useIsMounted();
  const [provider, setProvider] = useSafeState<GeocodeProvider>(isMounted, () =>
    initialProvider(allowFallback),
  );
  // The active provider is unavailable and no fallback was permitted, so there
  // are no results to show — distinct from a failed or malformed query.
  const [isProviderUnavailable, setIsProviderUnavailable] = useSafeState(
    isMounted,
    false,
  );
  const [isLoading, setIsLoading] = useSafeState(isMounted, false);
  const [error, setError] = useSafeState<string | undefined>(isMounted, undefined);
  const [results, setResults] = useSafeState<GeocodeResult[] | undefined>(isMounted, undefined);

  // Tracks the in-flight request so it can be aborted, and the latest request id
  // so late-arriving responses from superseded queries are discarded.
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestRequestIdRef = useRef(0);

  // Drop any in-flight request and forget prior results (e.g. input cleared or
  // shortened below the typeahead threshold).
  const clear = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    latestRequestIdRef.current += 1;
    setResults(undefined);
    setError(undefined);
    setIsProviderUnavailable(false);
    setIsLoading(false);
  }, [setError, setIsLoading, setIsProviderUnavailable, setResults]);

  const query = useCallback(
    async (value: string) => {
      if (!value) {
        clear();
        return;
      }

      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      const requestId = ++latestRequestIdRef.current;

      setIsLoading(true);
      setError(undefined);
      setIsProviderUnavailable(false);
      // Clear immediately so a subsequent search never shows the previous
      // query's hits while the new request is in flight (or if it fails).
      setResults(undefined);

      try {
        const startTime = performance.now();
        const {
          results: formattedResults,
          provider: usedProvider,
          peliasFeatures,
          fallbackCause,
        } = await geocodeSearch(value, {
          allowFallback,
          language: i18n.language,
          preferCity,
          // Read at request time, not render time: the fix may land between
          // keystrokes, and an early query simply goes out unbiased.
          focus: focusRef.current,
          signal: abortController.signal,
        });

        // A newer query has superseded this one; drop these results.
        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        if (usedProvider === "nominatim") {
          // Sticky: never switch back, so the widget's UI mode is stable for the
          // rest of the session.
          setProvider("nominatim");
          // The search telemetry field is Pelias-shaped, so report the outage
          // itself instead — this is how we learn a fallback happened.
          if (fallbackCause) {
            Sentry.captureException(fallbackCause, {
              tags: {
                hook: "useGeocodeQuery",
                geocodeFallback: "nominatim",
              },
            });
          }
        } else {
          service.bugs.geolocationSearchInfo({
            searchString: value,
            peliasResultJson: JSON.stringify(peliasFeatures ?? []),
            formattedResultJson: JSON.stringify(formattedResults),
            durationMs: performance.now() - startTime,
          });
        }

        setResults(formattedResults);
      } catch (e) {
        // A deliberate cancellation (newer keystroke) is not an error.
        if (abortController.signal.aborted) {
          return;
        }
        Sentry.captureException(e, {
          tags: {
            hook: "useGeocodeQuery",
          },
        });
        // A no-fallback surface hitting an outage is not a query the user got
        // wrong; the consumer shows a "try again shortly" message instead of the
        // provider's raw error text.
        if (!allowFallback && isOutageError(e)) {
          setIsProviderUnavailable(true);
        } else {
          setError(e instanceof Error ? e.message : "");
        }
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [
      allowFallback,
      clear,
      focusRef,
      i18n.language,
      preferCity,
      setError,
      setIsLoading,
      setIsProviderUnavailable,
      setProvider,
      setResults,
    ],
  );

  return {
    isLoading,
    error,
    results,
    query,
    clear,
    provider,
    isProviderUnavailable,
  };
};

function useUnsavedChangesWarning({
  isDirty,
  isSubmitted,
  warningMessage,
}: {
  isDirty: boolean;
  isSubmitted: boolean;
  warningMessage: string;
}) {
  const router = useRouter();
  // https://github.com/vercel/next.js/issues/2694#issuecomment-732990201
  useEffect(() => {
    const handleWindowClose = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = warningMessage;
      return;
    };
    const handleBrowseAway = () => {
      if (!isDirty || isSubmitted) return;
      // Note: window.confirm() shows browser's default "The page at [url] says:" title
      // This cannot be customized as next.js pages router does not offer useBlocker hook
      if (window.confirm(warningMessage)) return;
      router.events.emit("routeChangeError");
      throw Error("Cancelled due to unsaved changes");
    };
    window.addEventListener("beforeunload", handleWindowClose);
    router.events.on("routeChangeStart", handleBrowseAway);
    return () => {
      window.removeEventListener("beforeunload", handleWindowClose);
      router.events.off("routeChangeStart", handleBrowseAway);
    };
  }, [isDirty, router.events, isSubmitted, warningMessage]);
}

export { useGeocodeQuery, useIsClient, useIsMounted, useSafeState, useUnsavedChangesWarning };
