import { Coordinates } from "features/search/utils/constants";
import { LngLat } from "maplibre-gl";
import { useRouter } from "next/router";
import Sentry from "platform/sentry";
import { Dispatch, MutableRefObject, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { service } from "service";
import { autocomplete, toPeliasLanguage } from "utils/pelias";

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
 * Forward-geocoding autocomplete backed by Geocode.earth (Pelias Cloud)
 *
 * `query` is safe to call on every (debounced) keystroke: it aborts any
 * in-flight request and ignores stale responses so only the latest query's
 * results are surfaced. Results are localized via the active `i18n.language`
 * passed to the Pelias API.
 *
 * `preferCity` (homepage destination search) enables soft city ranking, label
 * collapse to locality, parent-area bbox, and dedupe by display string. Other
 * surfaces leave precise venue/address hits alone for address / event venue use.
 */
const useGeocodeQuery = (options?: { preferCity?: boolean }) => {
  const preferCity = options?.preferCity ?? false;
  const { i18n } = useTranslation();
  const isMounted = useIsMounted();
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
    setIsLoading(false);
  }, [setError, setIsLoading, setResults]);

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
      // Clear immediately so a subsequent search never shows the previous
      // query's hits while the new request is in flight (or if it fails).
      setResults(undefined);

      try {
        const startTime = performance.now();
        const { results: formattedResults, features } = await autocomplete(
          value,
          {
            language: toPeliasLanguage(i18n.language),
            preferCity,
            signal: abortController.signal,
          },
        );

        // A newer query has superseded this one; drop these results.
        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        service.bugs.geolocationSearchInfo({
          searchString: value,
          peliasResultJson: JSON.stringify(features),
          formattedResultJson: JSON.stringify(formattedResults),
          durationMs: performance.now() - startTime,
        });

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
        setError(e instanceof Error ? e.message : "");
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [clear, i18n.language, preferCity, setError, setIsLoading, setResults],
  );

  return { isLoading, error, results, query, clear };
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
