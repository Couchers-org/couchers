import { useFeatureValue } from "@growthbook/growthbook-react";
import { logEvent } from "features/analytics";
import { useCallback, useEffect, useRef } from "react";
import type { GeocodeProvider } from "utils/geocode";
import type { GeocodeResult } from "utils/hooks";

/**
 * Diagnostics for location search (Geocode.earth / Nominatim fallback), sent
 * through the analytics event collector.
 *
 * Everything here is gated by the GrowthBook flag `geocode_telemetry_enabled`.
 * It defaults to on, so the flag is a kill switch: telemetry keeps flowing when
 * GrowthBook itself is unreachable, which is exactly when outage diagnostics
 * matter most.
 *
 * Events:
 * - `geocode.request`: one per forward-search request, value = latency in ms.
 * - `geocode.failover`: a Geocode.earth outage switched to the fallback path.
 * - `geocode.my_location`: outcome of a "use my location" lookup, value = ms.
 * - `location_autocomplete.session`: one per widget interaction, from the first
 *   keystroke to its outcome, value = ms.
 * - `location_autocomplete.reselected`: the user started editing again shortly
 *   after picking a result (likely a wrong pick or a misleading label).
 *
 * Raw query text is never logged here (it is already recorded, with the raw
 * provider payload, by `GeolocationSearchInfo`); only lengths and counts are.
 */

type GeocodeTelemetry = (eventType: string, properties?: Record<string, unknown>, value?: number) => void;

type SessionOutcome = "selected" | "used_my_location" | "cleared" | "abandoned" | "left_page";

interface SessionState {
  startedAt: number;
  keystrokes: number;
  finalQueryLength: number;
  resultsShown: number;
  emptyResultsSeen: number;
  errorsSeen: number;
  submitReopens: number;
}

interface UseLocationSearchSessionOptions {
  surface: string;
  provider: GeocodeProvider;
  results: GeocodeResult[] | undefined;
  error: string | undefined;
  isProviderUnavailable: boolean;
}

export const GEOCODE_TELEMETRY_FLAG = "geocode_telemetry_enabled";

// Editing again within this window after a selection counts as a re-selection.
const RESELECT_WINDOW_MS = 10_000;

/**
 * Returns a stable `logEvent` that is a no-op while the kill switch is off. The
 * flag is read through a ref so callers can use it inside long-lived callbacks
 * without re-creating them when the flag changes.
 */
export function useGeocodeTelemetry(): GeocodeTelemetry {
  const enabled = useFeatureValue(GEOCODE_TELEMETRY_FLAG, true);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  return useCallback((eventType, properties, value) => {
    if (enabledRef.current) {
      logEvent(eventType, properties, value);
    }
  }, []);
}

function sameResult(a: GeocodeResult, b: GeocodeResult) {
  return a === b || (a.id !== undefined && a.id === b.id) || a.simplifiedName === b.simplifiedName;
}

/**
 * Tracks one location-widget interaction and logs a single
 * `location_autocomplete.session` summary when it ends, which is what exposes
 * abandonment, empty results, errors and ranking quality per surface.
 *
 * A session starts on the first keystroke and ends on a selection, "use my
 * location", clearing the field, unmount, or the page being unloaded (unmount
 * never runs on tab close, so the summary would otherwise be lost).
 */
export function useLocationSearchSession({
  surface,
  provider,
  results,
  error,
  isProviderUnavailable,
}: UseLocationSearchSessionOptions) {
  const track = useGeocodeTelemetry();
  const sessionRef = useRef<SessionState | null>(null);
  const lastSelectedAtRef = useRef<number | null>(null);

  // Read at end time, so the callbacks below stay stable.
  const contextRef = useRef({ surface, provider, results });
  contextRef.current = { surface, provider, results };

  const end = useCallback(
    (outcome: SessionOutcome, selected?: GeocodeResult) => {
      const session = sessionRef.current;
      sessionRef.current = null;
      // Nothing was typed: a selection made from a pre-filled list or a "use my
      // location" click still counts, anything else is not an interaction.
      if (!session && outcome !== "selected" && outcome !== "used_my_location") {
        return;
      }
      const { surface, provider, results } = contextRef.current;
      const now = performance.now();
      track(
        "location_autocomplete.session",
        {
          surface,
          provider,
          mode: provider === "nominatim" ? "submit" : "typeahead",
          outcome,
          keystrokes: session?.keystrokes ?? 0,
          final_query_length: session?.finalQueryLength ?? 0,
          results_shown: session?.resultsShown ?? 0,
          empty_results_seen: session?.emptyResultsSeen ?? 0,
          errors_seen: session?.errorsSeen ?? 0,
          submit_reopens: session?.submitReopens ?? 0,
          selected_rank: selected && results ? results.findIndex((result) => sameResult(result, selected)) : null,
          result_count: results?.length ?? null,
        },
        session ? now - session.startedAt : 0,
      );
    },
    [track],
  );

  const onInput = useCallback(
    (value: string) => {
      const now = performance.now();
      const lastSelectedAt = lastSelectedAtRef.current;
      if (lastSelectedAt !== null) {
        lastSelectedAtRef.current = null;
        if (now - lastSelectedAt < RESELECT_WINDOW_MS) {
          track(
            "location_autocomplete.reselected",
            { surface: contextRef.current.surface, provider: contextRef.current.provider },
            now - lastSelectedAt,
          );
        }
      }
      const session = sessionRef.current ?? {
        startedAt: now,
        keystrokes: 0,
        finalQueryLength: 0,
        resultsShown: 0,
        emptyResultsSeen: 0,
        errorsSeen: 0,
        submitReopens: 0,
      };
      session.keystrokes += 1;
      session.finalQueryLength = value.trim().length;
      sessionRef.current = session;
    },
    [track],
  );

  const onSelect = useCallback(
    (selected: GeocodeResult) => {
      end("selected", selected);
      lastSelectedAtRef.current = performance.now();
    },
    [end],
  );

  const onUseMyLocation = useCallback(() => {
    end("used_my_location");
    lastSelectedAtRef.current = performance.now();
  }, [end]);

  const onClear = useCallback(() => end("cleared"), [end]);

  const onSubmitReopen = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.submitReopens += 1;
    }
  }, []);

  useEffect(() => {
    if (sessionRef.current && results !== undefined) {
      sessionRef.current.resultsShown += 1;
      if (results.length === 0) {
        sessionRef.current.emptyResultsSeen += 1;
      }
    }
  }, [results]);

  useEffect(() => {
    if (sessionRef.current && (error || isProviderUnavailable)) {
      sessionRef.current.errorsSeen += 1;
    }
  }, [error, isProviderUnavailable]);

  // `pagehide` rather than `visibilitychange`: it fires on unload before the
  // collector's final `visibilitychange` flush (so the summary makes it into
  // that flush), and not on a mere tab switch, which should not end a session.
  useEffect(() => {
    const handlePageHide = () => end("left_page");
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      end("abandoned");
    };
  }, [end]);

  return { onInput, onSelect, onUseMyLocation, onClear, onSubmitReopen };
}
