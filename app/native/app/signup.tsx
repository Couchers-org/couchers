import { StyleSheet } from "react-native";
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useRef, useState } from "react";

import { useAuthContext } from "features/auth/AuthProvider";

import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import BasicScreen from "@/components/BasicScreen";

export default function CouchersScreen() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const URL_BASE = "http://192.168.1.111:3000"
  let webview = useRef<WebView>(null);

  const handleWebViewNavigationStateChange = (newNavState: WebViewNavigation) => {
    const { url } = newNavState;
    if (!url) return;
    const v = webview.current;
    if (!v) return;

    if (!url.startsWith(URL_BASE)) {
      v.stopLoading();
      console.log("oooop")
    }
  };

  return (
    <BasicScreen>
      <WebView
        ref={webview}
        style={styles.webview}
        source={{ uri: `${URL_BASE}/signup` }}
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
