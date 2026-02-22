import { useCallback, useEffect, useRef } from "react";

import { logEvent } from "./event-collector";

/**
 * Logs `funnel.step_entered` on mount and `funnel.step_exited` with duration
 * (seconds) as value on unmount. Props stored in ref for stability.
 *
 * Usage: `useFunnelStep("signup", "basic")` in each form step component.
 */
export function useFunnelStep(
  funnelName: string,
  stepName: string,
  properties: Record<string, unknown> = {},
) {
  const propsRef = useRef(properties);
  propsRef.current = properties;

  useEffect(() => {
    const startTime = performance.now();

    logEvent("funnel.step_entered", {
      funnel: funnelName,
      step: stepName,
      ...propsRef.current,
    });

    return () => {
      const durationS = (performance.now() - startTime) / 1000;
      logEvent(
        "funnel.step_exited",
        {
          funnel: funnelName,
          step: stepName,
          ...propsRef.current,
        },
        durationS,
      );
    };
    // Only re-run if funnel/step identity changes
  }, [funnelName, stepName]);
}

/**
 * Returns a ref to attach to a scrollable container. On unmount (or
 * visibilitychange hidden), logs the max scroll depth reached.
 *
 * Properties: `max_depth` (0-100 integer), value: depth (0.0-1.0).
 */
export function useScrollDepth(
  eventType: string,
  properties: Record<string, unknown> = {},
) {
  const propsRef = useRef(properties);
  propsRef.current = properties;

  const maxDepthRef = useRef(0);
  const hasLoggedRef = useRef(false);
  const containerRef = useRef<HTMLElement | null>(null);

  const logDepth = useCallback(() => {
    if (hasLoggedRef.current) return;
    hasLoggedRef.current = true;
    const depth = maxDepthRef.current;
    logEvent(
      eventType,
      { ...propsRef.current, max_depth: Math.round(depth * 100) },
      depth,
    );
  }, [eventType]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const maxScrollable = scrollHeight - clientHeight;
      if (maxScrollable <= 0) return;
      const depth = Math.min(scrollTop / maxScrollable, 1);
      if (depth > maxDepthRef.current) {
        maxDepthRef.current = depth;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        logDepth();
        // Reset so unmount doesn't double-log
        hasLoggedRef.current = true;
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      logDepth();
    };
  }, [logDepth]);

  return containerRef;
}

/**
 * Returns `{ onMouseEnter, onMouseLeave }` event handlers.
 * Logs hover dwell time (seconds) as value on mouse leave.
 */
export function useHoverDwell(
  eventType: string,
  properties: Record<string, unknown> = {},
) {
  const propsRef = useRef(properties);
  propsRef.current = properties;

  const enterTimeRef = useRef<number | null>(null);

  const onMouseEnter = useCallback(() => {
    enterTimeRef.current = performance.now();
  }, []);

  const onMouseLeave = useCallback(() => {
    if (enterTimeRef.current === null) return;
    const dwellS = (performance.now() - enterTimeRef.current) / 1000;
    enterTimeRef.current = null;
    logEvent(eventType, propsRef.current, dwellS);
  }, [eventType]);

  return { onMouseEnter, onMouseLeave };
}

/**
 * Returns `{ trackFieldFocus, trackFieldBlur, trackSubmit }` for tracking
 * form interactions.
 *
 * - First field focus logs `form.interaction_started`
 * - `trackFieldBlur` logs `form.field_blurred` with per-field duration
 * - `trackSubmit` logs `form.submitted` with total duration as value and
 *   a `field_durations` map in properties
 */
export function useFormInteraction(formName: string) {
  const startTimeRef = useRef<number | null>(null);
  const fieldStartRef = useRef<number | null>(null);
  const currentFieldRef = useRef<string | null>(null);
  const fieldDurationsRef = useRef<Record<string, number>>({});

  const trackFieldFocus = useCallback(
    (fieldName: string) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = performance.now();
        logEvent("form.interaction_started", { form: formName });
      }
      currentFieldRef.current = fieldName;
      fieldStartRef.current = performance.now();
    },
    [formName],
  );

  const trackFieldBlur = useCallback(
    (fieldName: string) => {
      if (fieldStartRef.current === null) return;
      const durationS = (performance.now() - fieldStartRef.current) / 1000;
      fieldStartRef.current = null;
      currentFieldRef.current = null;

      fieldDurationsRef.current[fieldName] =
        (fieldDurationsRef.current[fieldName] ?? 0) + durationS;

      logEvent("form.field_blurred", {
        form: formName,
        field: fieldName,
        duration: durationS,
      });
    },
    [formName],
  );

  const trackSubmit = useCallback(
    (extraProperties?: Record<string, unknown>) => {
      if (startTimeRef.current === null) return;
      const totalDurationS = (performance.now() - startTimeRef.current) / 1000;

      logEvent(
        "form.submitted",
        {
          form: formName,
          field_durations: { ...fieldDurationsRef.current },
          ...extraProperties,
        },
        totalDurationS,
      );

      // Reset state for potential re-use
      startTimeRef.current = null;
      fieldDurationsRef.current = {};
    },
    [formName],
  );

  return { trackFieldFocus, trackFieldBlur, trackSubmit };
}
