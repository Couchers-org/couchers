import { useCallback, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, WebViewNavigation } from "react-native-webview";

import { useAuthContext } from "@/features/auth/AuthContext";
import { dashboardRoute, loginRoute } from "@/routes";

const AUTH_SUCCESS_PATHS = [dashboardRoute];

export default function LoginScreen() {
  const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL!;
  const { markAuthenticated, markLoggedOut } = useAuthContext();
  const hasMarkedAuth = useRef(false);

  const handleNavigation = useCallback(
    ({ url }: WebViewNavigation) => {
      if (!url) {
        return;
      }

      const normalizedUrl = url.split("#")[0];
      const loginUrl = WEB_BASE_URL + loginRoute;

      if (normalizedUrl.startsWith(loginUrl)) {
        hasMarkedAuth.current = false;
        markLoggedOut();
        return;
      }

      if (hasMarkedAuth.current) {
        return;
      }

      if (
        AUTH_SUCCESS_PATHS.some((path) =>
          normalizedUrl.startsWith(WEB_BASE_URL + path)
        )
      ) {
        hasMarkedAuth.current = true;
        markAuthenticated();
      }
    },
    [WEB_BASE_URL, markAuthenticated, markLoggedOut]
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView
        source={{ uri: WEB_BASE_URL + loginRoute }}
        sharedCookiesEnabled
        onNavigationStateChange={handleNavigation}
      />
    </SafeAreaView>
  );
}
