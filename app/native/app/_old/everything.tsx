import { Image, StyleSheet, Button, Text } from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useRef, useState } from "react";
import { useMutation } from "react-query";
import { RpcError } from "grpc-web";
import { service } from "service";
import { StatusRes } from "proto/bugs_pb";
import Alert from "components/Alert";
import LoginForm from "features/auth/login/LoginForm";

import { useAuthContext } from "features/auth/AuthProvider";

import { useTranslation } from "i18n";
import { WebView, WebViewNavigation } from "react-native-webview";
import { AUTH, GLOBAL } from "i18n/namespaces";

const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL!;

export default function Everything() {
  const { t } = useTranslation([AUTH, GLOBAL]);

  const [pressed, setPressed] = useState<number>(0);

  const { authState, authActions } = useAuthContext();

  let webview = useRef<WebView>(null);

  const { data: resp, mutate: checkCoucherCount } = useMutation<
    StatusRes.AsObject,
    RpcError,
    void
  >(() => service.version.status());

  const logIn = () => {
    authActions.passwordLogin({
      username: "aapeli_native",
      password: "unsafepassword",
      rememberDevice: true,
    });
  };

  const logOut = () => {
    authActions.logout();
  };

  const onPress = () => {
    setPressed(pressed + 1);
    // Alert.alert('Simple Button pressed')
    checkCoucherCount();
  };

  const handleWebViewNavigationStateChange = (
    newNavState: WebViewNavigation,
  ) => {
    const { url } = newNavState;
    if (!url) return;
    const v = webview.current;
    if (!v) return;

    if (!url.startsWith(WEB_BASE_URL)) {
      v.stopLoading();
      console.log("oooop");
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/couchers512.png")}
          style={styles.couchersLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">{t("auth:login_page.title")}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        {authState.error && <Alert>{authState.error}</Alert>}
        <LoginForm />
      </ThemedView>
      <Button title="Check auth status" onPress={authActions.checkAuthStatus} />
      <ThemedView style={styles.stepContainer}>
        <ThemedText>Webview:</ThemedText>
        <WebView
          ref={webview}
          style={styles.webview}
          source={{ uri: `${WEB_BASE_URL}/signup` }}
          onNavigationStateChange={handleWebViewNavigationStateChange}
          injectedJavaScriptObject={{ isCouchersNativeEmbed: true }}
        />
        <ThemedText>(end webview)</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <Button title="Press me" onPress={onPress} />
        <ThemedText type="subtitle">
          {pressed == 0 ? "didn't press yet" : `pressed ${pressed} time(s)`}
        </ThemedText>
        <ThemedText type="subtitle">
          API response: version: {resp?.version}, # users: {resp?.coucherCount}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="title">
          auth state: userid: {authState.userId}
        </ThemedText>
        {authState.authenticated ? (
          <>
            <ThemedText>You are logged in!!</ThemedText>
            <Button title="Log out" onPress={logOut} />
          </>
        ) : (
          <>
            <ThemedText>You are logged out. Log in: </ThemedText>
            <Button title="Log in" onPress={logIn} />
          </>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  couchersLogo: {
    height: 350,
    width: 500,
    top: 0,
    right: 0,
    position: "absolute",
  },
  webview: {
    height: 250,
  },
});
