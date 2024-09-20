import { useRouter } from "expo-router";
import { useTranslation } from "i18n";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import BasicScreen from "@/components/BasicScreen";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

import { AUTH, GLOBAL } from "i18n/namespaces";

export default function Rules() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const router = useRouter();

  return (
    <BasicScreen>
      <ThemedView style={styles.backButtonContainer}>
        <Pressable style={styles.backButton} onPress={() => router.push("/")}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>
      </ThemedView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">{t("auth:sign_up_page.rules.title")}</ThemedText>
        <View style={styles.titleUnderline} />
      </ThemedView>
      <ThemedText>{t("auth:sign_up_page.rules.ensure_save")}</ThemedText>
      <ThemedText>{t("auth:sign_up_page.rules.comunity_platform")}</ThemedText>
      <ThemedText>{t("auth:sign_up_page.rules.your_help")}</ThemedText>
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
