import type { PropsWithChildren } from "react";
import { StyleSheet } from "react-native";

import { ThemedView } from "@/components/ThemedView";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BasicScreen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.sav}>
      <ThemedView style={styles.content}>{children}</ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sav: {
    height: "100%",
    backgroundColor: "#ffffff",
  },
  content: {
    height: "100%",
    padding: 32,
    gap: 16,
  },
});
