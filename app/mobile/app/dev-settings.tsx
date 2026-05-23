import * as Clipboard from "expo-clipboard";
import Constants from "expo-constants";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  clearUrlHistory,
  clearUrlOverrides,
  getApiBaseUrl,
  getDefaultApiBaseUrl,
  getDefaultWebBaseUrl,
  getUrlHistory,
  getWebBaseUrl,
  isDevUrlOverrideEnabled,
  PRESETS,
  setUrlOverrides,
  UrlOverrides,
} from "@/config/urls";
import { theme } from "@/theme";
import { reloadApp } from "@/utils/reloadApp";

function asString(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function hostLabel(entry: UrlOverrides): string {
  const url = entry.webBaseUrl || entry.apiBaseUrl || "";
  return url.replace(/^https?:\/\//, "");
}

export default function DevSettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const params = useLocalSearchParams<{ api?: string; web?: string }>();
  const paramApi = asString(params.api);
  const paramWeb = asString(params.web);

  const [apiBaseUrl, setApiBaseUrl] = useState(paramApi ?? getApiBaseUrl());
  const [webBaseUrl, setWebBaseUrl] = useState(paramWeb ?? getWebBaseUrl());
  const [history, setHistory] = useState<UrlOverrides[]>([]);
  const [linkExpanded, setLinkExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Apply incoming deep-link params (e.g. a scanned QR opening the app while
  // this screen is already mounted).
  useEffect(() => {
    if (paramApi !== undefined) setApiBaseUrl(paramApi);
    if (paramWeb !== undefined) setWebBaseUrl(paramWeb);
  }, [paramApi, paramWeb]);

  useEffect(() => {
    getUrlHistory().then(setHistory);
  }, []);

  const colors = {
    background: isDark
      ? theme.dark.background.default
      : theme.palette.background.default,
    text: isDark ? theme.dark.text.primary : theme.palette.text.primary,
    textSecondary: isDark
      ? theme.dark.text.secondary
      : theme.palette.text.secondary,
    border: isDark ? theme.dark.grey[100] : theme.palette.grey[200],
    inputBackground: isDark ? theme.dark.background.default : "#fff",
    muted: isDark ? theme.dark.grey[100] : theme.palette.grey[50],
    primary: isDark ? theme.dark.primary.main : theme.palette.primary.main,
  };

  if (!isDevUrlOverrideEnabled()) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.centered}>
          <Text style={{ color: colors.text }}>
            Developer settings are not available in this build.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const fill = (api: string, web: string) => {
    setApiBaseUrl(api);
    setWebBaseUrl(web);
  };

  const scheme = Array.isArray(Constants.expoConfig?.scheme)
    ? Constants.expoConfig?.scheme[0]
    : Constants.expoConfig?.scheme;
  const shareLink =
    scheme && (apiBaseUrl || webBaseUrl)
      ? `${scheme}://dev-settings?api=${encodeURIComponent(
          apiBaseUrl,
        )}&web=${encodeURIComponent(webBaseUrl)}`
      : null;

  const applyAndReload = async (action: () => Promise<void>) => {
    await action();
    try {
      await reloadApp();
    } catch {
      Alert.alert("Saved", "Restart the app for the new URLs to take effect.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  };

  const handleSave = () => {
    const invalid = [apiBaseUrl, webBaseUrl].some(
      (url) => url && !/^https?:\/\//.test(url.trim()),
    );
    if (invalid) {
      Alert.alert("Invalid URL", "URLs must start with http:// or https://");
      return;
    }
    applyAndReload(() => setUrlOverrides({ apiBaseUrl, webBaseUrl }));
  };

  const handleReset = () => {
    Alert.alert(
      "Reset URLs",
      "Clear overrides and restart with the build's default backend?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => applyAndReload(clearUrlOverrides),
        },
      ],
    );
  };

  const handleClearHistory = () => {
    clearUrlHistory().then(() => setHistory([]));
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    await Clipboard.setStringAsync(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Developer settings
            </Text>
            <Pressable hitSlop={12} onPress={() => router.back()}>
              <Text style={[styles.close, { color: colors.primary }]}>
                Close
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Point the app at a different backend. Saving restarts the app so the
            change takes effect.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Presets
          </Text>
          <View style={styles.chips}>
            {PRESETS.map((preset) => (
              <Chip
                key={preset.label}
                label={preset.label}
                onPress={() => fill(preset.apiBaseUrl, preset.webBaseUrl)}
                colors={colors}
              />
            ))}
            <Chip
              label="Build default"
              onPress={() =>
                fill(getDefaultApiBaseUrl(), getDefaultWebBaseUrl())
              }
              colors={colors}
            />
          </View>

          {history.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Recent
                </Text>
                <Pressable hitSlop={8} onPress={handleClearHistory}>
                  <Text style={[styles.clear, { color: colors.textSecondary }]}>
                    Clear
                  </Text>
                </Pressable>
              </View>
              <View style={styles.chips}>
                {history.map((entry, index) => (
                  <Chip
                    key={`${entry.apiBaseUrl}|${entry.webBaseUrl}|${index}`}
                    label={hostLabel(entry)}
                    onPress={() =>
                      fill(entry.apiBaseUrl ?? "", entry.webBaseUrl ?? "")
                    }
                    colors={colors}
                  />
                ))}
              </View>
            </>
          )}

          <Field
            label="API base URL"
            value={apiBaseUrl}
            onChangeText={setApiBaseUrl}
            placeholder={getDefaultApiBaseUrl()}
            defaultValue={getDefaultApiBaseUrl()}
            colors={colors}
          />
          <Field
            label="Web base URL"
            value={webBaseUrl}
            onChangeText={setWebBaseUrl}
            placeholder={getDefaultWebBaseUrl()}
            defaultValue={getDefaultWebBaseUrl()}
            colors={colors}
          />

          <Pressable
            accessibilityRole="button"
            onPress={handleSave}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: colors.primary },
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>Save & restart</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={handleReset}
            style={({ pressed }) => [
              styles.button,
              styles.resetButton,
              { borderColor: colors.border },
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.resetButtonText, { color: colors.text }]}>
              Reset to defaults
            </Text>
          </Pressable>

          {shareLink && (
            <View style={styles.shareSection}>
              <Pressable
                onPress={() => setLinkExpanded((v) => !v)}
                style={styles.shareHeader}
              >
                <Text style={[styles.shareTitle, { color: colors.textSecondary }]}>
                  {linkExpanded ? "▾" : "▸"} Share via link
                </Text>
              </Pressable>
              {linkExpanded && (
                <>
                  <Pressable onPress={handleCopyLink}>
                    <Text
                      style={[
                        styles.link,
                        {
                          color: colors.text,
                          borderColor: colors.border,
                          backgroundColor: colors.muted,
                        },
                      ]}
                    >
                      {shareLink}
                    </Text>
                  </Pressable>
                  <Text style={[styles.hint, { color: colors.textSecondary }]}>
                    {copied ? "Copied to clipboard" : "Tap the link to copy it"}
                  </Text>
                </>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FieldColors = {
  text: string;
  textSecondary: string;
  border: string;
  inputBackground: string;
};

function Chip({
  label,
  onPress,
  colors,
}: {
  label: string;
  onPress: () => void;
  colors: { text: string; border: string };
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { borderColor: colors.border },
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.chipText, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  defaultValue,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  defaultValue: string;
  colors: FieldColors;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: colors.border,
            backgroundColor: colors.inputBackground,
          },
        ]}
      />
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Default: {defaultValue}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  content: {
    padding: 24,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  close: {
    fontSize: 16,
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clear: {
    fontSize: 14,
    fontWeight: "600",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    marginTop: 6,
  },
  button: {
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
  resetButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  shareSection: {
    marginTop: 24,
  },
  shareHeader: {
    paddingVertical: 8,
  },
  shareTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  link: {
    fontSize: 13,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
});
