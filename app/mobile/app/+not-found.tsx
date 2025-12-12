import { Href, Link, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t("not_found.title") }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">{t("not_found.message")}</ThemedText>
        <Link href={"/" as Href} style={styles.link}>
          <ThemedText type="link">{t("not_found.go_home")}</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
