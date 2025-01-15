import { Link, useRouter } from "expo-router";
import { Trans, useTranslation } from "i18n";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import BasicScreen from "@/components/BasicScreen";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

import { useAuthContext } from "features/auth/AuthProvider";
import LoginForm from "features/auth/login/LoginForm";

import { AUTH, GLOBAL } from "i18n/namespaces";

export default function Login() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const router = useRouter();

  return (
    <BasicScreen>
      <ThemedView style={styles.backButtonContainer}>
        <Pressable style={styles.backButton} onPress={() => router.push("/landing")}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>
      </ThemedView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">{t("auth:login_page.header")}</ThemedText>
        <View style={styles.titleUnderline} />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <LoginForm />
      </ThemedView>
      <ThemedText>
        <Trans t={t} i18nKey="auth:login_page.no_account_prompt">
          No account yet?
        </Trans>
        <Link href="/sign_up" asChild>
          <Pressable>
            <ThemedText type="link">Sign up</ThemedText>
          </Pressable>
        </Link>
      </ThemedText>
    </BasicScreen>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    marginTop: 15,
  },
  titleUnderline: {
    width: "100%",
    height: 2,
    backgroundColor: "#00A398",
    shadowColor: "black",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    marginTop: 4,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  backButtonContainer: {
    position: "absolute",
    top: 10,
    left: 20,
    zIndex: 1,
  },
  backButton: {
    backgroundColor: "white",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
