import { Href, useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { WebViewNavigation } from "react-native-webview";

import {
  globalWebPathRef,
  lastMobileNavigationRef,
} from "@/state/webViewState";

interface UseWebNavigationOptions {
  webBaseUrl: string;
  currentPath: string;
  syncTargetPathRef: React.RefObject<string | null>;
  onRetryCountReset?: () => void;
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
}: UseWebNavigationOptions): UseWebNavigationReturn {
  const router = useRouter();
  const { i18n } = useTranslation();
  // Use global ref so it's shared across all WebEmbed instances
  const currentWebPathRef = globalWebPathRef;
  const canGoBackRef = useRef(false);

  // Extract locale from web path (e.g., "/de/dashboard" -> "de")
  const extractLocaleFromPath = useCallback(
    (webPath: string): string | null => {
      const match = webPath.match(/^\/([a-z]{2}(-[A-Z][a-z]+)?)\//);
      return match ? match[1] : null;
    },
    [],
  );

  // Strip locale prefix from path (e.g., "/de/donate" -> "/donate")
  const stripLocalePrefix = useCallback((webPath: string): string => {
    return webPath.replace(/^\/[a-z]{2}(-[A-Z][a-z]+)?\//, "/");
  }, []);

  // Map web paths to native route names
  const getRouteNameForPath = useCallback(
    (webPath: string): string | null => {
      // Strip locale prefix if present
      const pathWithoutLocale = stripLocalePrefix(webPath);

      // Main tab routes - match exact paths only (with optional trailing slash or query params)
      // Don't match deeper nested paths like /messages/chats/123
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

      // Check if this navigation is from a sync operation (to prevent fighting with focus effect)
      const isSyncNavigation =
        syncTargetPathRef.current !== null &&
        webPathWithoutQuery.startsWith(syncTargetPathRef.current);

      // If we're in the middle of a sync operation, don't update currentWebPathRef
      // or change i18n language - wait for the target URL to load
      if (syncTargetPathRef.current !== null && !isSyncNavigation) {
        return;
      }

      currentWebPathRef.current = webPath;

      // Extract locale from URL and sync with mobile app's i18n
      const webLocale = extractLocaleFromPath(webPathWithoutQuery) || "en";
      if (webLocale !== i18n.language) {
        i18n.changeLanguage(webLocale).catch((err) => {
          if (__DEV__) {
            console.error("Failed to change mobile app language:", err);
          }
        });
      }

      // Sync native route when WebView navigates to a different page
      const targetRoute = getRouteNameForPath(webPathWithoutQuery);
      const currentRoute = getRouteNameForPath(currentPath);

      if (isSyncNavigation) {
        // Clear the sync target now that we've seen the navigation
        syncTargetPathRef.current = null;
      }

      // Update native router to keep tab highlights in sync
      if (targetRoute !== currentRoute && targetRoute) {
        if (targetRoute === "[...slug]" || targetRoute === "md/[...slug]") {
          // For catch-all routes, navigate to the appropriate screen
          // Strip locale prefix for mobile router (mobile routes don't use locale prefixes)
          const pathForMobileRouter = stripLocalePrefix(webPathWithoutQuery);
          lastMobileNavigationRef.current = pathForMobileRouter;
          router.push(pathForMobileRouter as Href);
        } else {
          // For main tab routes, use push() to ensure tab highlighting updates correctly
          const queryString = webPath.includes("?")
            ? webPath.substring(webPath.indexOf("?"))
            : "";
          const targetPath = `/${targetRoute}${queryString}`;
          lastMobileNavigationRef.current = targetPath;
          router.push(targetPath as Href);
        }
      }
    },
    [
      webBaseUrl,
      currentPath,
      onRetryCountReset,
      extractLocaleFromPath,
      getRouteNameForPath,
      stripLocalePrefix,
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
