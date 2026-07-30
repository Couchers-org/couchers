import { MutableRefObject, useEffect, useRef } from "react";
import type { FocusPoint } from "utils/pelias";

/**
 * LOC-3: best-effort, silent acquisition of the user's approximate location, used
 * purely as a soft ranking signal (`focus.point`) on forward-geocoding requests.
 *
 * Deliberately never triggers a permission prompt: we only read the position when
 * the browser reports geolocation permission as already `granted`. A prompt on
 * homepage load for a background ranking nicety is not worth the interruption —
 * asking is LOC-4's job ("use my location" button), and once the user has granted
 * there, this hook starts biasing too. Everything else (permission `prompt`,
 * `denied`, no Permissions API, geolocation error, timeout) degrades silently to
 * no bias, i.e. normal unbiased autocomplete.
 *
 * Safari does not implement `permissions.query({ name: "geolocation" })`, so it
 * can't tell us the state. `markGeolocationGranted()` records a successful fix in
 * localStorage as a substitute signal, letting bias work there on subsequent
 * visits after an explicit, user-initiated geolocation elsewhere in the app.
 *
 * Returns a ref rather than state on purpose: the position arrives
 * asynchronously, callers read it inside an event-driven `query(...)` callback,
 * and a state update would needlessly re-render the widget (and re-create the
 * debounced query) mid-typing.
 */

// A fix up to half an hour old is plenty for city-level bias, and reusing a
// cached one avoids waking the GPS. Time out quickly: the first keystroke's query
// must never wait on geolocation — it just fires unbiased, and later keystrokes
// self-correct once a fix lands.
const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 30 * 60 * 1000,
  timeout: 5_000,
};

const GRANTED_STORAGE_KEY = "geolocationGranted";

/**
 * Remember that the user has granted geolocation, for browsers whose Permissions
 * API cannot report it (Safari). Call this from any flow where a geolocation fix
 * succeeded after an explicit user action (e.g. LOC-4's "use my location").
 */
export function markGeolocationGranted() {
  try {
    window.localStorage.setItem(GRANTED_STORAGE_KEY, "true");
  } catch {
    // Storage disabled or full — we simply lose the Safari bias hint.
  }
}

function wasGeolocationGranted(): boolean {
  try {
    return window.localStorage.getItem(GRANTED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Has the user already granted geolocation, such that reading their position
 * shows no prompt? Resolves `false` whenever we cannot be sure.
 */
async function hasGeolocationPermission(): Promise<boolean> {
  if (navigator.permissions?.query) {
    try {
      const status = await navigator.permissions.query({
        name: "geolocation",
      });
      if (status.state === "granted") {
        return true;
      }
      // `prompt` / `denied`: never ask here (LOC-3 is a silent enhancement). A
      // stale localStorage hint must not override a real `denied`/`prompt`.
      return false;
    } catch {
      // Permission name unsupported (Safari) — fall through to the stored hint.
    }
  }
  return wasGeolocationGranted();
}

export default function useLocationBias(
  enabled: boolean,
): MutableRefObject<FocusPoint | undefined> {
  const focusRef = useRef<FocusPoint | undefined>(undefined);

  useEffect(() => {
    if (
      !enabled ||
      typeof navigator === "undefined" ||
      !navigator.geolocation
    ) {
      return;
    }

    let isCancelled = false;
    hasGeolocationPermission().then((isGranted) => {
      if (isCancelled || !isGranted) {
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isCancelled) {
            return;
          }
          markGeolocationGranted();
          focusRef.current = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
        },
        () => {
          // Unavailable, timed out, or revoked between the permission check and
          // the read: stay unbiased. Never surfaced to the user.
        },
        GEOLOCATION_OPTIONS,
      );
    });

    return () => {
      isCancelled = true;
    };
  }, [enabled]);

  return focusRef;
}
