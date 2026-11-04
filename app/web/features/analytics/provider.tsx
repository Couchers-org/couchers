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
  const strippingZzRef = useRef(false);

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

    previousPathRef.current = window.location.pathname;
    previousTimestampRef.current = Date.now();
  }, []);

  // Remove zz from the URL so it isn't shared, bookmarked or re-logged on reload. This must go through the
  // Next router after it's ready: hydration replaces the URL with the original one, and the router keeps zz in
  // asPath/query (and history.state) otherwise, putting it back on later navigations.
  useEffect(() => {
    if (!router.isReady || !("zz" in router.query)) return;
    const query = { ...router.query };
    delete query.zz;
    const as = new URL(router.asPath, window.location.origin);
    as.searchParams.delete("zz");
    strippingZzRef.current = true;
    router.replace({ pathname: router.pathname, query }, as.pathname + as.search + as.hash, {
      shallow: true,
      scroll: false,
    });
  }, [router]);

  // Route change tracking
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      const [path, queryString] = url.split("?");
      if (strippingZzRef.current) {
        strippingZzRef.current = false;
        // the zz strip isn't a new page view, but a redirect that cancelled it is
        if (path.split("#")[0] === previousPathRef.current) return;
      }
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
