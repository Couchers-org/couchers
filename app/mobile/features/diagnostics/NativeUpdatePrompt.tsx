import * as Updates from "expo-updates";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { UpdatePrompt } from "@/features/diagnostics/updateDecision";
import { NativeUpdateAction } from "@/proto/bugs_pb";
import { theme } from "@/theme";

// Default button label per action when the backend doesn't supply link_text.
function defaultLinkText(
  action: NativeUpdateAction,
  t: (key: string) => string,
): string {
  switch (action) {
    case NativeUpdateAction.NATIVE_UPDATE_ACTION_REINSTALL:
      return t("update.action_reinstall");
    default:
      return t("update.action_update");
  }
}

// Renders the backend's update decision: a non-dismissible block screen, or a
// dismissible nag/deadline warning. OTA updates are applied in-app; store and
// reinstall actions open the supplied link.
export default function NativeUpdatePrompt({
  prompt,
  onDismiss,
}: {
  prompt: UpdatePrompt | null;
  onDismiss: () => void;
}) {
  const { t, i18n } = useTranslation();
  const isDark = useColorScheme() === "dark";
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!prompt) return null;

  const { info, mode } = prompt;
  const dismissible = mode !== "block";

  const colors = {
    background: isDark
      ? theme.dark.background.default
      : theme.palette.background.default,
    text: isDark ? theme.dark.text.primary : theme.palette.text.primary,
    textSecondary: isDark
      ? theme.dark.text.secondary
      : theme.palette.text.secondary,
    primary: isDark ? theme.dark.primary.main : theme.palette.primary.main,
  };

  const isOta = info.action === NativeUpdateAction.NATIVE_UPDATE_ACTION_OTA;

  const handlePrimary = async () => {
    setFailed(false);
    if (isOta) {
      setBusy(true);
      try {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      } catch (error) {
        console.warn("Failed to apply OTA update:", error);
        setBusy(false);
        setFailed(true);
      }
      return;
    }
    if (info.linkUrl) {
      await Linking.openURL(info.linkUrl);
    }
  };

  const title =
    info.required && mode === "block"
      ? t("update.required_title")
      : info.required
        ? t("update.recommended_title")
        : t("update.available_title");

  const message = info.message || t("update.default_message");
  const buttonLabel = info.linkText || defaultLinkText(info.action, t);

  return (
    <Modal
      visible
      transparent={false}
      animationType="fade"
      // Android hardware back: dismiss when allowed, otherwise swallow it.
      onRequestClose={dismissible ? onDismiss : () => {}}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.text }]}>
            {message}
          </Text>
          {mode === "warn" && info.actBy && (
            <Text style={[styles.deadline, { color: colors.textSecondary }]}>
              {t("update.deadline", {
                date: new Date(info.actBy.seconds * 1000).toLocaleString(
                  i18n.language,
                ),
              })}
            </Text>
          )}
          {failed && (
            <Text style={[styles.error, { color: theme.palette.error.main }]}>
              {t("update.failed")}
            </Text>
          )}

          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={handlePrimary}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: colors.primary },
              (pressed || busy) && styles.buttonPressed,
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{buttonLabel}</Text>
            )}
          </Pressable>

          {dismissible && !busy && (
            <Pressable
              accessibilityRole="button"
              onPress={onDismiss}
              style={styles.laterButton}
            >
              <Text style={[styles.laterText, { color: colors.textSecondary }]}>
                {t("update.later")}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  content: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
  deadline: {
    fontSize: 14,
    textAlign: "center",
  },
  error: {
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    alignSelf: "stretch",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  laterButton: {
    paddingVertical: 8,
  },
  laterText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
