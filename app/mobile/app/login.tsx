import { useColorScheme, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useRouter } from "expo-router";

import { useAuthContext } from "@/features/auth/AuthContext";
import { loginRoute } from "@/routes";
import { theme } from "@/theme";

function getBiometricTypeName(): string {
  if (Platform.OS === "ios") {
    return "Face ID";
  }
  return "biometrics";
}

export default function LoginScreen() {
  const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL!;
  const {
    markAuthenticated,
    setUserId,
    setJailed,
    biometricsEnabled,
    biometricsAvailable,
    enableBiometrics,
  } = useAuthContext();
  const router = useRouter();
  const colorScheme = useColorScheme();

  const backgroundColor =
    colorScheme === "dark"
      ? theme.palette.common.black
      : theme.palette.common.white;

  const offerBiometricEnrollment = async () => {
    // Skip if biometrics native module isn't available (e.g., Expo Go)
    if (!biometricsAvailable) {
      router.replace("/(tabs)/dashboard");
      return;
    }

    try {
      // Dynamically import to avoid errors in Expo Go
      const LocalAuthentication = await import("expo-local-authentication");

      // Check if biometrics are available on device
      const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);

      if (!hasHardware || !isEnrolled) {
        // Biometrics not available - just navigate
        router.replace("/(tabs)/dashboard");
        return;
      }

      const biometricName = getBiometricTypeName();

      // Prompt user to enable biometrics
      Alert.alert(
        `Enable ${biometricName}?`,
        `Would you like to use ${biometricName} for faster login next time?`,
        [
          {
            text: "Not Now",
            style: "cancel",
            onPress: () => {
              router.replace("/(tabs)/dashboard");
            },
          },
          {
            text: "Enable",
            onPress: async () => {
              // Test biometric authentication to ensure it works
              const result = await LocalAuthentication.authenticateAsync({
                promptMessage: `Confirm ${biometricName}`,
                cancelLabel: "Cancel",
              });

              if (result.success) {
                await enableBiometrics();
              }
              router.replace("/(tabs)/dashboard");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error offering biometric enrollment:", error);
      router.replace("/(tabs)/dashboard");
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
          router.replace("/(tabs)/dashboard");
        }
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
        source={{ uri: WEB_BASE_URL + loginRoute }}
        sharedCookiesEnabled
        onMessage={handleMessage}
      />
    </SafeAreaView>
  );
}
