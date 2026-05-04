/**
 * Analytics Journey Hooks
 *
 * Specialized hooks for tracking detailed user interactions and behavior patterns.
 * These help measure how users navigate through your app and interact with content.
 *
 * WHAT YOU CAN TRACK:
 * - Funnel steps (signup flows, checkout, etc.) with time spent per step
 * - Scroll depth to see how far users read content
 * - Hover dwell time to measure interest in elements
 * - Form interactions to understand where users struggle
 *
 * HOW TO USE:
 * Import the hook you need and add it to your component. Each hook automatically
 * logs events at the right time (e.g., on mount, unmount, scroll, etc.).
 *
 * @example
 * // Track a signup step
 * useFunnelStep("signup", "email-verification");
 *
 * // Track how far users scroll
 * const scrollRef = useScrollDepth("article.scroll", { article_id: "123" });
 * <div ref={scrollRef}>...</div>
 */

import { useCallback, useEffect, useRef } from "react";

import { logEvent } from "./eventCollector";

/**
 * Track user progress through a multi-step flow (signup, checkout, onboarding, etc.).
 *
 * Automatically logs when the user enters a step and when they leave, including
 * how long they spent on that step. This helps identify where users drop off or
 * get stuck in your flows.
 *
 * @param funnelName - Name of the overall flow (e.g., "signup", "checkout")
 * @param stepName - Name of this specific step (e.g., "email", "payment")
 * @param properties - Optional additional data to track with this step
 *
 * @example
 * // In your step component
 * useFunnelStep("checkout", "payment-info");
 *
 * // With extra properties
 * useFunnelStep("signup", "profile-setup", { user_type: "host" });
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
 * Track how far users scroll through content (articles, long pages, etc.).
 *
 * Returns a ref to attach to your scrollable element. Automatically tracks the
 * maximum scroll depth reached and logs it when the user leaves the page or
 * closes the tab. This helps you understand if users are reading your content
 * or dropping off early.
 *
 * @param eventType - Name for the event (e.g., "article.scrolled")
 * @param properties - Additional data about the content being scrolled
 * @returns A ref to attach to your scrollable element
 *
 * @example
 * const scrollRef = useScrollDepth("article.read", { article_id: post.id });
 * return <article ref={scrollRef}>...</article>;
 */
export function useScrollDepth<T extends HTMLElement = HTMLElement>(
  eventType: string,
  properties: Record<string, unknown> = {},
) {
  const propsRef = useRef(properties);
  propsRef.current = properties;

  const maxDepthRef = useRef(0);
  const hasLoggedRef = useRef(false);
  const containerRef = useRef<T | null>(null);

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
 * Track how long users hover over an element (useful for measuring interest).
 *
 * Returns event handlers to attach to your element. Logs the hover duration
 * when the user moves their mouse away. This helps identify which elements
 * catch users' attention.
 *
 * @param eventType - Name for the event (e.g., "cta.hovered")
 * @param properties - Additional data about the element
 * @returns Object with onMouseEnter and onMouseLeave handlers
 *
 * @example
 * const hoverHandlers = useHoverDwell("feature.explored", { feature: "map" });
 * return <div {...hoverHandlers}>...</div>;
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
 * Track detailed form interactions to understand where users struggle.
 *
 * Returns functions to call on field focus, blur, and form submit. Automatically
 * tracks which fields users spend time on, helping identify confusing or
 * problematic form fields.
 *
 * @param formName - Name of the form (e.g., "signup", "profile-edit")
 * @returns Object with trackFieldFocus, trackFieldBlur, and trackSubmit functions
 *
 * Events logged:
 * - `form.interaction_started` - When user focuses first field
 * - `form.field_blurred` - When user leaves each field (with time spent)
 * - `form.submitted` - When form is submitted (with per-field duration breakdown)
 *
 * @example
 * const { trackFieldFocus, trackFieldBlur, trackSubmit } = useFormInteraction("signup");
 *
 * <input
 *   onFocus={() => trackFieldFocus("email")}
 *   onBlur={() => trackFieldBlur("email")}
 * />
 * <button onClick={() => trackSubmit({ success: true })}>Submit</button>
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
