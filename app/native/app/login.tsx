import { Link, useRouter } from "expo-router";
import { Trans, useTranslation } from "i18n";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from '@expo/vector-icons';

import Alert from "components/Alert";
import BasicScreen from "@/components/BasicScreen";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

import { useAuthContext } from "features/auth/AuthProvider";
import LoginForm from "features/auth/login/LoginForm";

import { AUTH, GLOBAL } from "i18n/namespaces";

export default function Login() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const { authState } = useAuthContext();
  const router = useRouter();

  return (
    <BasicScreen>
      <ThemedView style={styles.backButtonContainer}>
        <Pressable style={styles.backButton} onPress={() => router.push('/')}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>
      </ThemedView>
      <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">{t("auth:login_page.header")}</ThemedText>
          <View style={styles.titleUnderline}/>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        {authState.error && <Alert>{authState.error}</Alert>}
        <LoginForm />
      </ThemedView>
      <ThemedText>
        <Trans t={t} i18nKey="auth:login_page.no_account_prompt">
          No account yet?
        </Trans>
        <Link href="./signup" asChild>
          <Pressable>
            <ThemedText type="link">Sign up</ThemedText>
          </Pressable>
        </Link>
      </ThemedText>
    </BasicScreen>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.7)", // Semi-transparent white overlay
  },
  titleContainer: {
    flexDirection: "column", // Changed to column for centering
    alignItems: "center", // Center align items
    gap: 8,
    marginTop: 60, // Existing margin
  },
  titleUnderline: {
    width: '100%', // Change this to 'auto' if you want it to fit the text
    height: 2, // Thickness of the line
    backgroundColor: '#00A398', // Line color
    shadowColor: 'black', // Shadow color
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25, // 25% opacity
    shadowRadius: 4, // Shadow radius
    marginTop: 4, // Space between text and line
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  signupContainer: {
    marginTop: "auto", // Push to the bottom
    alignItems: "center",
  },
  divider: {
    width: "66.67%", // 2/3 of the container width
    height: 1,
    backgroundColor: "#767676",
    marginBottom: 30,
  },
  backButtonContainer: {
    position: 'absolute',
    top: 10, // Moved back button up
    left: 20,
    zIndex: 1,
  },
  backButton: {
    backgroundColor: 'white', // Changed background color to white
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000', // Shadow color
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3, // Shadow opacity
    shadowRadius: 4, // Shadow radius
    elevation: 5, // For Android shadow
  },
});
