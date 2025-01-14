import { StyleSheet } from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import { useRef } from "react";

import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";

import { SafeAreaView } from "react-native-safe-area-context";

type WebEmbedProps = {
  path: string;
};

export default function Terms({ path }: WebEmbedProps) {
  const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL!;

  const { t } = useTranslation([AUTH, GLOBAL]);
  let webview = useRef<WebView>(null);

  const handleWebViewNavigationStateChange = (
    newNavState: WebViewNavigation,
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

  return (
    <SafeAreaView style={styles.sav}>
      <WebView
        ref={webview}
        style={styles.webview}
        source={{ uri: WEB_BASE_URL + path }}
        sharedCookiesEnabled={true}
        onNavigationStateChange={handleWebViewNavigationStateChange}
        injectedJavaScriptObject={{ isCouchersNativeEmbed: true }}
        onMessage={(event) => {
          console.log(event.nativeEvent.data);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sav: {
    height: "100%",
    backgroundColor: "#ffffff",
  },
  webview: {
    margin: 0,
    padding: 0,
    height: "100%",
  },
});
