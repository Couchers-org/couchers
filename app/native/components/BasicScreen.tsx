import type { PropsWithChildren } from "react";
import { StyleSheet, ViewStyle } from "react-native";

import { ThemedView } from "@/components/ThemedView";
import { SafeAreaView } from "react-native-safe-area-context";

interface BasicScreenProps extends PropsWithChildren {
  style?: ViewStyle;
}

export default function BasicScreen({ children, style }: BasicScreenProps) {
  return (
    <SafeAreaView style={[styles.sav, style]}>
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
