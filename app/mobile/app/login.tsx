import { useFocusEffect } from "@react-navigation/native";
import { Href, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, BackHandler, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { useAuthContext } from "@/features/auth/AuthContext";
import { useTranslation } from "@/i18n";
import { loginRoute } from "@/routes";
import { theme } from "@/theme";
import { getBiometricDisplayName } from "@/app/utils/getBiometricDisplayName";

export default function LoginScreen() {
  const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL!;
  const { t } = useTranslation();
  const {
    markAuthenticated,
    markLoggedOut,
    setUserId,
    setJailed,
    biometricsEnabled,
    biometricsAvailable,
    enableBiometrics,
    enableSecureLogin,
  } = useAuthContext();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [webViewKey, setWebViewKey] = useState<number>(0);

  // Prevent Android back button from navigating away from login screen
  // This fixes security bypass where users could press back to access authenticated screens
  // Using useFocusEffect ensures the handler is only active when this screen is focused
  // (best practice per React Navigation docs)
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Return true to prevent default back behavior (navigating to previous screen)
        // Users must authenticate to proceed - they can't go back to authenticated screens
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, []),
  );

  const backgroundColor =
    colorScheme === "dark"
      ? theme.palette.common.black
      : theme.palette.common.white;

  const offerBiometricEnrollment = async () => {
    // Skip if biometrics native module isn't available (e.g., Expo Go)
    if (!biometricsAvailable) {
      return;
    }

    try {
      // Dynamically import to avoid errors in Expo Go
      const LocalAuthentication = await import("expo-local-authentication");

      // Check if biometrics are available on device
      const [hasHardware, isEnrolled, supportedTypes] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
      ]);

      if (!hasHardware || !isEnrolled) {
        return;
      }

      const biometricName = getBiometricDisplayName({ supportedTypes });

      // Prompt user to enable biometrics
      Alert.alert(
        t("biometrics.enable_title", { biometricType: biometricName }),
        t("biometrics.enable_message", { biometricType: biometricName }),
        [
          {
            text: t("biometrics.not_now_button"),
            style: "cancel",
            onPress: async () => {
              // Enable secure login via device credentials (PIN/pattern/passcode)
              await enableSecureLogin();
              router.replace("/(tabs)/dashboard" as Href);
            },
          },
          {
            text: t("biometrics.enable_button"),
            onPress: async () => {
              // Test biometric authentication to ensure it works
              const result = await LocalAuthentication.authenticateAsync({
                promptMessage: t("biometrics.confirm_prompt", {
                  biometricType: biometricName,
                }),
                cancelLabel: t("biometrics.cancel_button"),
              });

              if (result.success) {
                await enableBiometrics();
              }
              router.replace("/(tabs)/dashboard" as Href);
            },
          },
        ],
      );
    } catch (error) {
      if (__DEV__) {
        console.error("Error offering biometric enrollment:", error);
      }
      router.replace("/(tabs)/dashboard" as Href);
    }
  };

  const handleMessage = async (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "LOGIN_SUCCESS") {
        // Update mobile auth state from web login
        setUserId(data.userId);
        setJailed(data.jailed || false);
        markAuthenticated();

        // Offer biometric enrollment if not already enabled and available
        if (!biometricsEnabled && biometricsAvailable) {
          await offerBiometricEnrollment();
        } else {
          // Already have biometrics enabled or not available - just navigate
          router.replace("/(tabs)/dashboard" as Href);
        }
      } else if (data.type === "LOGOUT") {
        // Clear mobile auth state and reset the WebView to drop history
        await markLoggedOut();
        setWebViewKey((k: number): number => k + 1);
      }
    } catch (error) {
      // Silently ignore non-JSON messages (expected from browser/WebView internals)
      if (__DEV__) {
        console.debug("LoginScreen: Ignoring non-JSON message", error);
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <WebView
        key={webViewKey}
        source={{ uri: WEB_BASE_URL + loginRoute }}
        sharedCookiesEnabled
        onMessage={handleMessage}
      />
    </SafeAreaView>
  );
}
