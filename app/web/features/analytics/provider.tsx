/**
 * Analytics Provider
 *
 * Wraps your app to automatically track key user behaviors without any additional setup.
 * Just wrap your app once and you're done!
 *
 * WHAT IT TRACKS AUTOMATICALLY:
 * - Session starts (when users first land on your site)
 * - Page views (including time spent on each page)
 * - Device info (screen size, browser, language)
 * - Marketing attribution (UTM parameters from ads/campaigns)
 * - Referral sources (where users came from)
 *
 * HOW TO USE:
 * Wrap your app's root component with this provider. That's it!
 *
 * @example
 * // In your _app.tsx or root layout
 * <AnalyticsProvider>
 *   <YourApp />
 * </AnalyticsProvider>
 *
 * For custom event tracking beyond automatic page views, use the hooks from
 * journey-hooks.ts or call logEvent() directly from event-collector.ts.
 */

import { useRouter } from "next/router";
import { ReactNode, useEffect, useRef } from "react";

import {
  destroyCollector,
  initializeCollector,
  logEvent,
} from "./event-collector";

/**
 * Extract UTM parameters from the URL for marketing attribution.
 * These help track which campaigns, ads, or links brought users to your site.
 */
function getUtmParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ]) {
    const val = params.get(key);
    if (val) utm[key] = val;
  }
  return utm;
}

/**
 * Get query parameters excluding UTM params (for cleaner page.viewed events).
 * This keeps your analytics focused on actual page parameters, not marketing tags.
 */
function getFilteredSearch(queryString: string): string | null {
  const params = new URLSearchParams(queryString);
  const filtered = new URLSearchParams();
  params.forEach((value, key) => {
    if (!key.startsWith("utm_")) {
      filtered.set(key, value);
    }
  });
  const result = filtered.toString();
  return result || null;
}

/**
 * Provider component that enables automatic analytics tracking.
 *
 * Handles the complete analytics lifecycle:
 * - Initializes event collection on mount
 * - Tracks session start with device/attribution data
 * - Tracks all page navigation automatically
 * - Cleans up and flushes events on unmount
 *
 * @param children - Your app's components
 */
export default function AnalyticsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const previousPathRef = useRef<string | null>(null);
  const previousTimestampRef = useRef<number>(Date.now());
  const initializedRef = useRef(false);

  // Session start + initial page view (runs once on mount)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Initialize event listeners
    initializeCollector();

    logEvent("session.started", {
      ...getUtmParams(),
      referrer: document.referrer || null,
      landing_page: window.location.pathname,
      user_agent: navigator.userAgent,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      language: navigator.language,
    });

    logEvent("page.viewed", {
      path: window.location.pathname,
      search: getFilteredSearch(window.location.search),
      previous_path: null,
      time_on_previous_page: null,
    });

    previousPathRef.current = window.location.pathname;
    previousTimestampRef.current = Date.now();
  }, []);

  // Route change tracking
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      const [path, queryString] = url.split("?");
      const now = Date.now();
      const timeOnPreviousPage = (now - previousTimestampRef.current) / 1000;

      logEvent("page.viewed", {
        path,
        search: getFilteredSearch(queryString ?? ""),
        previous_path: previousPathRef.current,
        time_on_previous_page: timeOnPreviousPage,
      });

      previousPathRef.current = path;
      previousTimestampRef.current = now;
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      destroyCollector();
    };
  }, []);

  return <>{children}</>;
}
