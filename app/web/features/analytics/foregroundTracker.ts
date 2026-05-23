/**
 * Accumulates wall-clock and foreground (document visible) time since creation.
 *
 * Wire `onVisibilityChange` to the document's `visibilitychange` event, then
 * call `finalize()` once (e.g. on unmount) to read the totals.
 */
export interface ForegroundTracker {
  onVisibilityChange: () => void;
  finalize: () => { foregroundMs: number; totalMs: number };
}

export function createForegroundTracker(): ForegroundTracker {
  const startedAt = performance.now();
  let foregroundAccumMs = 0;
  let visibleSince: number | null =
    typeof document !== "undefined" && document.visibilityState === "visible"
      ? startedAt
      : null;

  return {
    onVisibilityChange() {
      const now = performance.now();
      if (document.visibilityState === "visible") {
        if (visibleSince === null) visibleSince = now;
      } else if (visibleSince !== null) {
        foregroundAccumMs += now - visibleSince;
        visibleSince = null;
      }
    },
    finalize() {
      const now = performance.now();
      if (visibleSince !== null) {
        foregroundAccumMs += now - visibleSince;
        visibleSince = null;
      }
      return {
        foregroundMs: Math.round(foregroundAccumMs),
        totalMs: Math.round(now - startedAt),
      };
    },
  };
}
