import { useCallback, useEffect, useRef } from "react";

import { logEvent } from "./event-collector";

/**
 * Returns a stable `logEvent` function for use in components.
 */
export function useLogEvent() {
  return useCallback(
    (
      eventType: string,
      properties?: Record<string, unknown>,
      value?: number,
    ) => {
      logEvent(eventType, properties, value);
    },
    [],
  );
}

/**
 * Returns [start, stop] callbacks for timing an event.
 * On `stop()`, logs the event with value = duration in seconds.
 */
export function useDurationEvent(
  eventType: string,
  properties: Record<string, unknown> = {},
) {
  const startTimeRef = useRef<number | null>(null);

  const start = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const stop = useCallback(() => {
    if (startTimeRef.current === null) return;
    const durationS = (performance.now() - startTimeRef.current) / 1000;
    startTimeRef.current = null;
    logEvent(eventType, properties, durationS);
  }, [eventType, properties]);

  return [start, stop] as const;
}

/**
 * Returns a callback ref. When the element enters the viewport,
 * fires the event once via IntersectionObserver.
 */
export function useImpressionRef(
  eventType: string,
  properties: Record<string, unknown> = {},
  options?: { threshold?: number },
) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hasFiredRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const callbackRef = useCallback(
    (node: HTMLElement | null) => {
      // Disconnect previous observer
      observerRef.current?.disconnect();

      if (!node || hasFiredRef.current) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && !hasFiredRef.current) {
              hasFiredRef.current = true;
              logEvent(eventType, properties);
              observerRef.current?.disconnect();
              break;
            }
          }
        },
        { threshold: options?.threshold ?? 0.5 },
      );

      observerRef.current.observe(node);
    },
    [eventType, properties, options?.threshold],
  );

  return callbackRef;
}
