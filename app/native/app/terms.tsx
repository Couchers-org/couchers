import { StyleSheet } from "react-native";
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useRef } from "react";

import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import BasicScreen from "@/components/BasicScreen";

const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL!;

export default function CouchersScreen() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  let webview = useRef<WebView>(null);

  const handleWebViewNavigationStateChange = (newNavState: WebViewNavigation) => {
    const { url } = newNavState;
    if (!url) return;
    const v = webview.current;
    if (!v) return;

    if (!url.startsWith(WEB_BASE_URL)) {
      v.stopLoading();
      console.log("oooop")
    }
  };

  return (
    <BasicScreen>
      <WebView
        ref={webview}
        style={styles.webview}
        source={{ uri: `${WEB_BASE_URL}/terms` }}
        onNavigationStateChange={handleWebViewNavigationStateChange}
        injectedJavaScriptObject={{ customValue: 'myCustomValue' }}
      />
    </BasicScreen>
  );
}

const styles = StyleSheet.create({
  webview: {
    height: 250,
  },
});
