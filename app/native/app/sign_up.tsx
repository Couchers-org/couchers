import { Link, useRouter } from "expo-router";
import { Trans, useTranslation } from "i18n";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Alert from "components/Alert";
import BasicScreen from "@/components/BasicScreen";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

import { useAuthContext } from "features/auth/AuthProvider";

import { AUTH, GLOBAL } from "i18n/namespaces";
import SingUpForm from "@/features/auth/sing_up/SingUpForm";
import AccountForm from "@/features/auth/sing_up/AccountForm";

function CurrentForm() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const { authState } = useAuthContext();
  const state = authState.flowState;

  console.log("state ", state);

  if (state == null || state.needAccount) {
    return (
      <>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title"> {t("auth:account_form.header")}</ThemedText>
          <View style={styles.titleUnderline} />
        </ThemedView>
        <ThemedView style={styles.stepContainer}>
          <AccountForm />
        </ThemedView>
      </>
    );
  } else if (state.needBasic) {
    return (
      <>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">{t("auth:sign_up_page.title")}</ThemedText>
          <View style={styles.titleUnderline} />
        </ThemedView>
        <ThemedView style={styles.stepContainer}>
          <SingUpForm />
        </ThemedView>
      </>
    );
  } else if (state.needAcceptCommunityGuidelines) {
    return (
      <>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title"> {t("auth:account_form.header")}</ThemedText>
          <View style={styles.titleUnderline} />
        </ThemedView>
        <ThemedView style={styles.stepContainer}>
          <ThemedText>CommunityGuidelinesForm</ThemedText>
        </ThemedView>
      </>
    );
  } else if (state.needFeedback) {
    return (
      <>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">
            {" "}
            {t("auth:feedback_form.header")}
          </ThemedText>
          <View style={styles.titleUnderline} />
        </ThemedView>
        <ThemedView style={styles.stepContainer}>
          <ThemedText>FeedbackForm</ThemedText>
        </ThemedView>
      </>
    );
  } else if (state.needVerifyEmail) {
    return (
      <>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">
            {" "}
            {t("auth:sign_up_need_verification_title")}
          </ThemedText>
          <View style={styles.titleUnderline} />
        </ThemedView>
        <ThemedView style={styles.stepContainer}>
          <ThemedText>ResendVerificationEmailForm</ThemedText>
        </ThemedView>
      </>
    );
  } else if (state.authRes) {
    return (
      <>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">
            {" "}
            {t("auth:sign_up_completed_title")}
          </ThemedText>
          <View style={styles.titleUnderline} />
        </ThemedView>
        <ThemedText> {t("auth:sign_up_confirmed_prompt")}</ThemedText>
      </>
    );
  } else {
    throw Error(t("auth:unhandled_sign_up_state"));
  }
}

export default function SignUp() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const { authActions } = useAuthContext();
  const router = useRouter();

  return (
    <BasicScreen>
      <ThemedView style={styles.backButtonContainer}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            authActions.clearFlowState();
            authActions.clearError();
            router.push("/landing");
          }}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>
      </ThemedView>
      <CurrentForm />
      <Link href="/rules" asChild>
        <ThemedText type="link">Rules</ThemedText>
      </Link>
    </BasicScreen>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
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
