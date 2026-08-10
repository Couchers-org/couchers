import { useCallback, useEffect, useRef } from "react";

import { logEvent } from "./eventCollector";

/**
 * Returns a stable `logEvent` function for use in components.
 */
export function useLogEvent() {
  return useCallback((eventType: string, properties?: Record<string, unknown>, value?: number) => {
    logEvent(eventType, properties, value);
  }, []);
}

/**
 * Returns [start, stop] callbacks for timing an event.
 * On `stop()`, logs the event with value = duration in seconds.
 *
 * `properties` is stored in a ref so callers don't need to memoize it.
 * `stop` accepts optional `extraProperties` for dynamic data at measurement time.
 */
export function useDurationEvent(eventType: string, properties: Record<string, unknown> = {}) {
  const startTimeRef = useRef<number | null>(null);
  const propsRef = useRef(properties);
  propsRef.current = properties;

  const start = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const stop = useCallback(
    (extraProperties?: Record<string, unknown>) => {
      if (startTimeRef.current === null) return;
      const durationS = (performance.now() - startTimeRef.current) / 1000;
      startTimeRef.current = null;
      logEvent(eventType, { ...propsRef.current, ...extraProperties }, durationS);
    },
    [eventType],
  );

  return [start, stop] as const;
}

/**
 * Returns a callback ref. Fires the event once via IntersectionObserver after
 * the element has been continuously >= `threshold` visible for `minDurationMs`
 * (default 0 = fires on first intersection).
 *
 * `properties`, `threshold`, and `minDurationMs` are stored in refs so callers
 * don't need to memoize them — the observer is only recreated when
 * `eventType` changes.
 */
export function useImpressionRef(
  eventType: string,
  properties: Record<string, unknown> = {},
  options?: { threshold?: number; minDurationMs?: number },
) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const visibleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFiredRef = useRef(false);
  const propsRef = useRef(properties);
  propsRef.current = properties;
  const thresholdRef = useRef(options?.threshold ?? 0.5);
  thresholdRef.current = options?.threshold ?? 0.5;
  const minDurationRef = useRef(options?.minDurationMs ?? 0);
  minDurationRef.current = options?.minDurationMs ?? 0;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      if (visibleTimerRef.current) {
        clearTimeout(visibleTimerRef.current);
        visibleTimerRef.current = null;
      }
    };
  }, []);

  const callbackRef = useCallback(
    (node: HTMLElement | null) => {
      // Disconnect previous observer
      observerRef.current?.disconnect();
      if (visibleTimerRef.current) {
        clearTimeout(visibleTimerRef.current);
        visibleTimerRef.current = null;
      }

      if (!node || hasFiredRef.current) return;

      const fire = () => {
        if (hasFiredRef.current) return;
        hasFiredRef.current = true;
        logEvent(eventType, propsRef.current);
        observerRef.current?.disconnect();
      };

      observerRef.current = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (hasFiredRef.current) return;
            if (entry.isIntersecting) {
              if (minDurationRef.current === 0) {
                fire();
                return;
              }
              if (!visibleTimerRef.current) {
                visibleTimerRef.current = setTimeout(() => {
                  visibleTimerRef.current = null;
                  fire();
                }, minDurationRef.current);
              }
            } else if (visibleTimerRef.current) {
              clearTimeout(visibleTimerRef.current);
              visibleTimerRef.current = null;
            }
          }
        },
        { threshold: thresholdRef.current },
      );

      observerRef.current.observe(node);
    },
    [eventType],
  );

  return callbackRef;
}
