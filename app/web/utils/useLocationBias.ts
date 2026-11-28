import { MutableRefObject, useEffect, useRef } from "react";
import type { FocusPoint } from "utils/pelias";

/**
 * Best-effort, silent acquisition of the user's approximate location, used
 * purely as a soft ranking signal (`focus.point`) on forward-geocoding requests.
 *
 * Deliberately never triggers a permission prompt: we only read the position when
 * the browser reports geolocation permission as already `granted`. A prompt is
 * done on sign-up, later the user can also manually trigger a prompt by clicking
 * the "use my location" button.
 * Once the user has granted it, this hook starts biasing too. Everything else
 * (permission `prompt`, `denied`, no Permissions API, geolocation error, timeout)
 * degrades silently to no bias, i.e. normal unbiased autocomplete.
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

// Two decimals is ~1 km: plenty for city-level bias, and limits how precisely
// the member's position is disclosed to the geocoding provider.
const COORDINATE_DECIMALS = 2;

function roundCoordinate(value: number): number {
  const factor = 10 ** COORDINATE_DECIMALS;
  return Math.round(value * factor) / factor;
}

/**
 * Has the user already granted geolocation, such that reading their position
 * shows no prompt? Resolves `false` whenever we cannot be sure. `prompt` (which
 * includes "ask every time") and `denied` must never lead to a read here.
 */
async function hasGeolocationPermission(): Promise<boolean> {
  if (!navigator.permissions?.query) {
    return false;
  }
  try {
    const status = await navigator.permissions.query({
      name: "geolocation",
    });
    return status.state === "granted";
  } catch {
    // Permission name unsupported by this browser.
    return false;
  }
}

export default function useLocationBias(enabled: boolean): MutableRefObject<FocusPoint | undefined> {
  const focusRef = useRef<FocusPoint | undefined>(undefined);

  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !navigator.geolocation) {
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
          focusRef.current = {
            lat: roundCoordinate(position.coords.latitude),
            lon: roundCoordinate(position.coords.longitude),
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
