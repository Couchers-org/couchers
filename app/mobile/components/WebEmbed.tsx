import { StyleSheet, View, useColorScheme } from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import { useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import { useTranslation } from "@/i18n";
import { AUTH, GLOBAL } from "@/i18n/namespaces";
import { theme } from "@/theme";
import { useAuthContext } from "@/features/auth/AuthProvider";

type WebEmbedProps = {
  path: string;
};

export default function Terms({ path }: WebEmbedProps) {
  const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL!;

  const { t } = useTranslation([AUTH, GLOBAL]);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { authActions } = useAuthContext();
  let webview = useRef<WebView>(null);

  const backgroundColor =
    colorScheme === "dark"
      ? theme.palette.common.black
      : theme.palette.common.white;

  const handleWebViewNavigationStateChange = (
    newNavState: WebViewNavigation
  ) => {
    const { url } = newNavState;
    if (!url) return;
    const v = webview.current;
    if (!v) return;

    if (!url.startsWith(WEB_BASE_URL)) {
      console.log("oooop");
      v.stopLoading();
    }
  };
  // @TODO(JNA): Remove postMessage from web app
  // const handleMessage = (event: any) => {
  //   try {
  //     const data = JSON.parse(event.nativeEvent.data);
  //     if (data.type === "LOGOUT") {
  //       authActions.logout();
  //       router.replace("/login");
  //     }
  //   } catch (e) {
  //     console.log(
  //       "WebEmbed received non-JSON message:",
  //       event.nativeEvent.data
  //     );
  //   }
  // };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={{ height: insets.top, backgroundColor }} />
      <WebView
        ref={webview}
        style={styles.webview}
        source={{ uri: WEB_BASE_URL + path }}
        sharedCookiesEnabled={true}
        // onNavigationStateChange={handleWebViewNavigationStateChange}
        injectedJavaScriptObject={{ isCouchersNativeEmbed: true }}
        // onMessage={handleMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
