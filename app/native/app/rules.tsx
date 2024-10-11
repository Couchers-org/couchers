import { useRouter } from "expo-router";
import { useTranslation } from "i18n";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import BasicScreen from "@/components/BasicScreen";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

import { AUTH, GLOBAL } from "i18n/namespaces";
import Button from "@/components/Button";
import { useState } from "react";

export default function Rules() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const router = useRouter();
  const [step, setStep] = useState(0);

  return (
    <BasicScreen>
      {step == 0 && (
        <ThemedView style={styles.backButtonContainer}>
          <Pressable style={styles.backButton} onPress={() => router.push("/landing")}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </Pressable>
        </ThemedView>
      )}

      {getStepContent(step, t)}
      <View style={styles.buttonContainer}>
        <View style={styles.progressBar}>
          {[0, 1, 2, 3, 4].map((index) => (
            <View
              key={index}
              style={[
                styles.progressStep,
                index <= step ? styles.progressStepActive : {},
              ]}
            />
          ))}
        </View>
        <View style={styles.buttonRow}>
          {step > 0 && (
            <Button
              filled={false}
              onPress={() => setStep(step - 1)}
              title={t("global:back")}
              style={styles.stepBackButton}
            />
          )}
          <Button
            filled={true}
            onPress={() => {
              if (step < 4) {
                setStep(step + 1);
              } else {
                // Handle completion
              }
            }}
            title={t("global:continue")}
            style={step > 0 ? styles.continueButton : styles.fullWidthButton}
          />
        </View>
      </View>
    </BasicScreen>
  );
}

function getStepContent(step: number, t: Function) {
  switch (step) {
    case 0:
      return (
        <>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="subtitle">
              {t("auth:sign_up_page.rules.title")}
            </ThemedText>
          </ThemedView>
          <ThemedText>{t("auth:sign_up_page.rules.ensure_save")}</ThemedText>
          <ThemedText>
            {t("auth:sign_up_page.rules.comunity_platform")}
          </ThemedText>
          <ThemedText>{t("auth:sign_up_page.rules.your_help")}</ThemedText>
        </>
      );
    case 1:
      return (
        <>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="subtitle">
              {t("auth:sign_up_page.rules.keep_money_out")}
            </ThemedText>
          </ThemedView>
          <ThemedText>
            {t("auth:sign_up_page.rules.non_transactional")}
          </ThemedText>
          <ThemedText>
            {t("auth:sign_up_page.rules.no_money_exchanges")}
          </ThemedText>
          <ThemedText>
            {t("auth:sign_up_page.rules.community_driven")}
          </ThemedText>
        </>
      );
    case 2:
      return (
        <>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="subtitle">
              {t("auth:sign_up_page.rules.not_dating_app")}
            </ThemedText>
          </ThemedView>
          <ThemedText>{t("auth:sign_up_page.rules.not_for_dating")}</ThemedText>
          <ThemedText>
            {t("auth:sign_up_page.rules.no_money_exchanges")}
          </ThemedText>
          <ThemedText>{t("auth:sign_up_page.rules.harassment_ban")}</ThemedText>
        </>
      );
    case 3:
      return (
        <>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="subtitle">
              {t("auth:sign_up_page.rules.be_kind")}
            </ThemedText>
          </ThemedView>
          <ThemedText>
            {t("auth:sign_up_page.rules.inclusive_community")}
          </ThemedText>
          <ThemedText>
            {t("auth:sign_up_page.rules.treat_with_respect")}
          </ThemedText>
        </>
      );
    case 4:
      return (
        <>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="subtitle">
              {t("auth:sign_up_page.rules.be_safe_sensible")}
            </ThemedText>
          </ThemedView>
          <ThemedText>
            {t("auth:sign_up_page.rules.read_profiles_references")}
          </ThemedText>
          <ThemedText>
            {t("auth:sign_up_page.rules.report_inappropriate")}
          </ThemedText>
        </>
      );
  }
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
  buttonContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepBackButton: {
    flex: 1,
    marginRight: 10,
  },
  continueButton: {
    flex: 1,
    marginLeft: 10,
  },
  fullWidthButton: {
    width: "100%",
  },
  progressBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  progressStep: {
    width: "18%",
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: "#00A398",
  },
  line: {
    height: 2,
    backgroundColor: "#00A398",
    marginBottom: 20,
  },
});
