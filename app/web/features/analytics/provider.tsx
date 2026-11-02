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
 * - Marketing attribution (UTM parameters from ads/campaigns, refs from our emails)
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
 * journeyHooks.ts or call logEvent() directly from eventCollector.ts.
 */

import { useRouter } from "next/router";
import { ReactNode, useEffect, useRef } from "react";

import { destroyCollector, initializeCollector, logEvent } from "./eventCollector";

// zz: added to links in our emails, see app/backend/src/couchers/email/zz.py
const ATTRIBUTION_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "zz"];

/**
 * Extract attribution parameters (UTM params and email refs) from the URL.
 * These help track which campaigns, ads, emails, or links brought users to your site.
 */
function getAttributionParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const attribution: Record<string, string> = {};
  for (const key of ATTRIBUTION_PARAMS) {
    const val = params.get(key);
    if (val) attribution[key] = val;
  }
  return attribution;
}

/**
 * Get query parameters excluding attribution params (for cleaner page.viewed events).
 * This keeps your analytics focused on actual page parameters, not marketing tags.
 */
function getFilteredSearch(queryString: string): string | null {
  const params = new URLSearchParams(queryString);
  const filtered = new URLSearchParams();
  params.forEach((value, key) => {
    if (!key.startsWith("utm_") && !ATTRIBUTION_PARAMS.includes(key)) {
      filtered.set(key, value);
    }
  });
  const result = filtered.toString();
  return result || null;
}

/**
 * Remove zz from the address bar so it isn't shared, bookmarked or re-logged on reload.
 */
function removeZzFromAddressBar() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("zz")) return;
  url.searchParams.delete("zz");
  // bypass the Next router so this can't race with redirects (e.g. to login)
  window.history.replaceState(window.history.state, "", url.toString());
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
export default function AnalyticsProvider({ children }: { children: ReactNode }) {
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
      ...getAttributionParams(),
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

    removeZzFromAddressBar();

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
