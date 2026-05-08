import { Href, useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { WebViewNavigation } from "react-native-webview";

import {
  detailRouteOriginRef,
  lastMobileNavigationRef,
} from "@/state/webViewState";

interface UseWebNavigationOptions {
  webBaseUrl: string;
  currentPath: string;
  syncTargetPathRef: React.RefObject<string | null>;
  onRetryCountReset?: () => void;
  onDetailNavigation?: () => void;
}

interface UseWebNavigationReturn {
  handleNavigationStateChange: (navState: WebViewNavigation) => void;
  canGoBackRef: React.RefObject<boolean>;
  currentWebPathRef: React.RefObject<string>;
}

/**
 * Custom hook for handling WebView navigation, routing, and locale syncing
 */
export function useWebNavigation({
  webBaseUrl,
  currentPath,
  syncTargetPathRef,
  onRetryCountReset,
  onDetailNavigation,
}: UseWebNavigationOptions): UseWebNavigationReturn {
  const router = useRouter();
  const { i18n } = useTranslation();
  // Per-instance ref so each tab tracks its own WebView path independently.
  // Seed with currentPath so the initial "already at target" check fires correctly
  // and the detail-page guard doesn't block the first sync.
  const currentWebPathRef = useRef(currentPath);
  const canGoBackRef = useRef(false);
  // iOS WKWebView fires a stale event for the old detail URL after a sync; skip it.
  const skipNextDetailRef = useRef<string | null>(null);

  const extractLocaleFromPath = useCallback(
    (webPath: string): string | null => {
      const match = webPath.match(/^\/([a-z]{2}(-[A-Z][a-z]+)?)\//);
      return match ? match[1] : null;
    },
    [],
  );

  const stripLocalePrefix = useCallback((webPath: string): string => {
    return webPath.replace(/^\/[a-z]{2}(-[A-Z][a-z]+)?\//, "/");
  }, []);

  const getRouteNameForPath = useCallback(
    (webPath: string): string | null => {
      const pathWithoutLocale = stripLocalePrefix(webPath);

      if (
        pathWithoutLocale === "/dashboard" ||
        pathWithoutLocale.startsWith("/dashboard?")
      )
        return "dashboard";
      if (
        pathWithoutLocale === "/messages" ||
        pathWithoutLocale.startsWith("/messages?")
      )
        return "messages";
      if (
        pathWithoutLocale === "/search" ||
        pathWithoutLocale.startsWith("/search?")
      )
        return "search";
      if (
        pathWithoutLocale === "/communities" ||
        pathWithoutLocale.startsWith("/communities?")
      )
        return "communities";
      if (
        pathWithoutLocale === "/events" ||
        pathWithoutLocale.startsWith("/events?")
      )
        return "events";

      // Special routes
      if (pathWithoutLocale.startsWith("/md/")) return "md/[...slug]";

      // Catch-all for other routes
      if (pathWithoutLocale.startsWith("/")) return "[...slug]";

      return null;
    },
    [stripLocalePrefix],
  );

  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      const { url, loading, canGoBack: webViewCanGoBack } = navState;

      // Track whether WebView can go back
      canGoBackRef.current = webViewCanGoBack;

      if (!url || loading) {
        return;
      }

      // Reset retry count on successful page load
      onRetryCountReset?.();

      const normalizedUrl = url.split("#")[0];

      // Skip external URLs
      if (!normalizedUrl.startsWith(webBaseUrl)) {
        return;
      }

      // Track the current web path
      const webPath: string = normalizedUrl.replace(webBaseUrl, "") || "/";
      const webPathWithoutQuery = webPath.split("?")[0];

      // Detect whether this navigation was triggered by a MOBILE_NAVIGATE sync.
      const syncTargetPathOnly =
        syncTargetPathRef.current?.split("?")[0] ?? null;
      const isSyncNavigation =
        syncTargetPathOnly !== null &&
        webPathWithoutQuery.startsWith(syncTargetPathOnly);

      // Skip if the URL hasn't changed — prevents re-triggering navigation when
      // WKWebView replays its current URL on tab focus or after a sync completes.
      // Still clear an in-flight sync if this event confirms we're at the target.
      if (webPath === currentWebPathRef.current) {
        if (isSyncNavigation) {
          syncTargetPathRef.current = null;
        }
        return;
      }

      // Skip the stale iOS WKWebView replay of a detail URL after a sync.
      if (skipNextDetailRef.current !== null) {
        const shouldSkip = webPathWithoutQuery === skipNextDetailRef.current;
        skipNextDetailRef.current = null;
        if (shouldSkip) {
          return;
        }
      }

      // While a sync is in flight, ignore unrelated navigations.
      if (syncTargetPathRef.current !== null && !isSyncNavigation) {
        return;
      }

      const previousWebPathWithoutQuery =
        currentWebPathRef.current.split("?")[0];
      currentWebPathRef.current = webPath;

      // Sync native route when WebView navigates to a different page
      const targetRoute = getRouteNameForPath(webPathWithoutQuery);
      const currentRoute = getRouteNameForPath(currentPath);

      // Skip language sync for detail routes (e.g. /users/123): no locale prefix
      // is a false "English" signal that would re-trigger the tab's sync useEffect
      // and inject MOBILE_NAVIGATE into the detail page still in the WebView.
      const isDetailRoute =
        targetRoute === "[...slug]" || targetRoute === "md/[...slug]";
      const webLocale = extractLocaleFromPath(webPathWithoutQuery) || "en";
      if (!isDetailRoute && webLocale !== i18n.language) {
        i18n.changeLanguage(webLocale).catch((err) => {
          if (__DEV__) {
            console.error("Failed to change mobile app language:", err);
          }
        });
      }

      if (isSyncNavigation) {
        syncTargetPathRef.current = null;
        // Record the previous detail path so the stale iOS replay event is skipped.
        const previousRoute = getRouteNameForPath(previousWebPathWithoutQuery);
        if (previousRoute === "[...slug]" || previousRoute === "md/[...slug]") {
          skipNextDetailRef.current = previousWebPathWithoutQuery;
        }
      }

      if (targetRoute !== currentRoute && targetRoute) {
        if (isDetailRoute) {
          // Navigate to [..slug] so no tab is highlighted while on a detail page.
          const detailPath = stripLocalePrefix(webPathWithoutQuery);
          detailRouteOriginRef.current = currentPath;
          lastMobileNavigationRef.current = detailPath;
          router.navigate(detailPath as Href);
          // Set skip ref now so the stale iOS replay after onDetailNavigation's MOBILE_NAVIGATE is caught.
          skipNextDetailRef.current = webPathWithoutQuery;
          onDetailNavigation?.();
        } else {
          // navigate() switches the active tab in place; push() would add a root-level
          // (tabs) stack entry and flash the dashboard before settling on the target tab.
          const queryString = webPath.includes("?")
            ? webPath.substring(webPath.indexOf("?"))
            : "";
          const targetPath = `/${targetRoute}${queryString}`;
          lastMobileNavigationRef.current = targetPath;
          router.navigate(targetPath as Href);
        }
      }
    },
    [
      webBaseUrl,
      currentPath,
      onRetryCountReset,
      onDetailNavigation,
      extractLocaleFromPath,
      getRouteNameForPath,
      router,
      i18n,
    ],
  );

  return {
    handleNavigationStateChange,
    canGoBackRef,
    currentWebPathRef,
  };
}
