import { Href, useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { WebViewNavigation } from "react-native-webview";

interface UseWebNavigationOptions {
  webBaseUrl: string;
  currentPath: string;
  onRetryCountReset?: () => void;
}

interface UseWebNavigationReturn {
  handleNavigationStateChange: (navState: WebViewNavigation) => void;
  canGoBack: boolean;
}

/**
 * Custom hook for handling WebView navigation, routing, and locale syncing
 */
export function useWebNavigation({
  webBaseUrl,
  currentPath,
  onRetryCountReset,
}: UseWebNavigationOptions): UseWebNavigationReturn {
  const router = useRouter();
  const { i18n } = useTranslation();
  const currentWebPathRef = useRef<string>(currentPath);
  const canGoBackRef = useRef(false);

  // Extract locale from web path (e.g., "/de/dashboard" -> "de")
  const extractLocaleFromPath = useCallback(
    (webPath: string): string | null => {
      const match = webPath.match(/^\/([a-z]{2}(-[A-Z][a-z]+)?)\//);
      return match ? match[1] : null;
    },
    [],
  );

  // Map web paths to native route names
  const getRouteNameForPath = useCallback((webPath: string): string | null => {
    // Strip locale prefix if present
    const pathWithoutLocale = webPath.replace(
      /^\/[a-z]{2}(-[A-Z][a-z]+)?\//,
      "/",
    );

    // Main tab routes
    if (pathWithoutLocale.startsWith("/dashboard")) return "dashboard";
    if (pathWithoutLocale.startsWith("/messages")) return "messages";
    if (pathWithoutLocale.startsWith("/search")) return "search";
    if (pathWithoutLocale.startsWith("/communities")) return "communities";
    if (pathWithoutLocale.startsWith("/events")) return "events";

    // Special routes
    if (pathWithoutLocale.startsWith("/md/")) return "md/[...slug]";

    // Catch-all for other routes
    if (pathWithoutLocale.startsWith("/")) return "[...slug]";

    return null;
  }, []);

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
        if (__DEV__) {
          console.log("*****SKIPPING EXTERNAL URL*****", normalizedUrl);
        }
        return;
      }

      // Track the current web path
      const webPath: string = normalizedUrl.replace(webBaseUrl, "") || "/";
      const webPathWithoutQuery = webPath.split("?")[0];
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

      // Navigate native router when the route changes
      if (targetRoute !== currentRoute && targetRoute) {
        if (targetRoute === "[...slug]" || targetRoute === "md/[...slug]") {
          // For catch-all routes, navigate with full path
          router.navigate(webPathWithoutQuery as Href);
        } else {
          // For main tab routes, preserve query parameters
          const queryString = webPath.includes("?")
            ? webPath.substring(webPath.indexOf("?"))
            : "";
          router.navigate(`/${targetRoute}${queryString}` as Href);
        }
      }
    },
    [
      webBaseUrl,
      currentPath,
      onRetryCountReset,
      extractLocaleFromPath,
      getRouteNameForPath,
      router,
      i18n,
    ],
  );

  return {
    handleNavigationStateChange,
    canGoBack: canGoBackRef.current,
  };
}
