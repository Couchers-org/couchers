import { Button, Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Alert from "components/Alert";
import LoginForm from "features/auth/login/LoginForm";

import { useAuthContext } from "features/auth/AuthProvider";

import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import BasicScreen from "@/components/BasicScreen";
import { Link } from "expo-router";

export default function Logout() {
  const { t } = useTranslation([AUTH, GLOBAL]);

  const { authState, authActions } = useAuthContext();

  return (
    <BasicScreen>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Log out</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        {authState.error && <Alert>{authState.error}</Alert>}
        <Button title="Log out" onPress={authActions.logout} />
        <Link href="/landing" asChild>
          <Pressable>
            <ThemedText type="button">To start</ThemedText>
          </Pressable>
        </Link>
      </ThemedView>
    </BasicScreen>
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
});
