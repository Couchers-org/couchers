import * as Updates from "expo-updates";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { UpdatePrompt } from "@/features/diagnostics/updateDecision";
import { NativeUpdateAction, NativeUpdateCause } from "couchers/proto/bugs_pb";
import { theme } from "@/theme";

const logo = require("@/assets/images/couchers_logo.png");

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

// Renders the update prompt:
//   - non-dismissible block screen (mode = "block")
//   - dismissible warn screen (mode = "warn")
//
// The body and preamble are hardcoded on the client so they read naturally and translators
// don't have to keep variants in sync. If the backend supplies info.message (reserved for
// special cases — not generated today), it overrides the structured body.
export default function NativeUpdatePrompt({
  prompt,
  onDismiss,
}: {
  prompt: UpdatePrompt | null;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
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

  const title = t("update.required_title");
  // Pick the body + preamble pair by (cause, mode). Banned always blocks.
  const variant =
    info.cause === NativeUpdateCause.NATIVE_UPDATE_CAUSE_BANNED
      ? "banned"
      : mode === "block"
        ? "block"
        : "warn";
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
          <Image source={logo} style={styles.logo} resizeMode="contain" />

          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

          {info.message ? (
            <Text style={[styles.body, { color: colors.text }]}>
              {info.message}
            </Text>
          ) : (
            <>
              <Text style={[styles.body, { color: colors.text }]}>
                {t(`update.body_${variant}`)}
              </Text>
              <Text style={[styles.preamble, { color: colors.textSecondary }]}>
                {t(`update.preamble_${variant}`)}
              </Text>
            </>
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

          {failed && (
            <Text style={[styles.error, { color: theme.palette.error.main }]}>
              {t("update.failed")}
            </Text>
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
  logo: {
    width: 96,
    height: 96,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
  preamble: {
    fontSize: 14,
    lineHeight: 20,
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
