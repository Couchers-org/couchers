import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import {
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useNetworkStatus } from "@/features/network/NetworkStatusContext";
import { theme } from "@/theme";

export default function OfflineBanner({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { isOffline, recheck } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const [checking, setChecking] = useState(false);

  const handlePress = async () => {
    setChecking(true);
    try {
      await recheck();
    } finally {
      setChecking(false);
    }
  };

  // The tree shape must not depend on isOffline, or toggling it would remount every screen.
  return (
    <View style={styles.container}>
      {isOffline && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("errors.no_connection")}
          onPress={handlePress}
          disabled={checking}
          style={[
            styles.banner,
            {
              paddingTop: insets.top + 6,
              backgroundColor:
                colorScheme === "dark"
                  ? theme.palette.grey[600]
                  : theme.palette.common.black,
            },
          ]}
        >
          {checking ? (
            <ActivityIndicator
              size="small"
              color={theme.palette.common.white}
            />
          ) : (
            <Text style={styles.text}>{t("errors.no_connection")}</Text>
          )}
        </Pressable>
      )}
      {/* While shown, the banner covers the top safe area so screens below shouldn't pad for it again. */}
      <SafeAreaInsetsContext.Provider
        value={isOffline ? { ...insets, top: 0 } : insets}
      >
        {children}
      </SafeAreaInsetsContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 6,
    paddingHorizontal: 16,
    minHeight: 32,
  },
  text: {
    color: theme.palette.common.white,
    fontSize: 14,
  },
});
