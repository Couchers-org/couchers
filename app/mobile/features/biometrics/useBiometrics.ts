import { useCallback, useEffect, useState } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const BIOMETRICS_ENABLED_KEY = "biometrics_enabled";

export type BiometricType = "fingerprint" | "facial" | "none";

type BiometricsState = {
  /** Whether the device has biometric hardware */
  hasHardware: boolean;
  /** Whether the user has enrolled biometrics on the device */
  isEnrolled: boolean;
  /** Whether the user has enabled biometrics for this app */
  isEnabled: boolean;
  /** The type of biometrics available */
  biometricType: BiometricType;
  /** Whether the initial check is still loading */
  isLoading: boolean;
};

type BiometricsActions = {
  /** Prompt the user to authenticate with biometrics */
  authenticate: (promptMessage?: string) => Promise<boolean>;
  /** Enable biometrics for this app (saves preference) */
  enableBiometrics: () => Promise<void>;
  /** Disable biometrics for this app (clears preference) */
  disableBiometrics: () => Promise<void>;
  /** Check if biometrics can be used (hardware + enrolled + enabled) */
  canUseBiometrics: () => boolean;
};

export type UseBiometricsReturn = BiometricsState & BiometricsActions;

function mapAuthenticationType(
  types: LocalAuthentication.AuthenticationType[]
): BiometricType {
  if (
    types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
  ) {
    return "facial";
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return "fingerprint";
  }
  return "none";
}

export function useBiometrics(): UseBiometricsReturn {
  const [state, setState] = useState<BiometricsState>({
    hasHardware: false,
    isEnrolled: false,
    isEnabled: false,
    biometricType: "none",
    isLoading: true,
  });

  // Check biometrics capabilities on mount
  useEffect(() => {
    async function checkBiometrics() {
      try {
        const [hasHardware, isEnrolled, types, storedEnabled] =
          await Promise.all([
            LocalAuthentication.hasHardwareAsync(),
            LocalAuthentication.isEnrolledAsync(),
            LocalAuthentication.supportedAuthenticationTypesAsync(),
            SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY),
          ]);

        setState({
          hasHardware,
          isEnrolled,
          isEnabled: storedEnabled === "true",
          biometricType: mapAuthenticationType(types),
          isLoading: false,
        });
      } catch (error) {
        console.error("Error checking biometrics:", error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    }

    checkBiometrics();
  }, []);

  const authenticate = useCallback(
    async (promptMessage = "Authenticate to continue"): Promise<boolean> => {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage,
          cancelLabel: "Cancel",
          // Allow device passcode as fallback on iOS
          disableDeviceFallback: Platform.OS === "android",
        });

        return result.success;
      } catch (error) {
        console.error("Biometric authentication error:", error);
        return false;
      }
    },
    []
  );

  const enableBiometrics = useCallback(async () => {
    await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, "true");
    setState((prev) => ({ ...prev, isEnabled: true }));
  }, []);

  const disableBiometrics = useCallback(async () => {
    await SecureStore.deleteItemAsync(BIOMETRICS_ENABLED_KEY);
    setState((prev) => ({ ...prev, isEnabled: false }));
  }, []);

  const canUseBiometrics = useCallback(() => {
    return state.hasHardware && state.isEnrolled && state.isEnabled;
  }, [state.hasHardware, state.isEnrolled, state.isEnabled]);

  return {
    ...state,
    authenticate,
    enableBiometrics,
    disableBiometrics,
    canUseBiometrics,
  };
}

/**
 * Standalone function to check if biometrics are enabled (for use outside React)
 */
export async function isBiometricsEnabled(): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY);
  return stored === "true";
}

/**
 * Standalone function to check if biometrics are available (hardware + enrolled)
 */
export async function isBiometricsAvailable(): Promise<boolean> {
  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hasHardware && isEnrolled;
}

/**
 * Get a friendly name for the biometric type
 */
export function getBiometricTypeName(type: BiometricType): string {
  switch (type) {
    case "facial":
      return Platform.OS === "ios" ? "Face ID" : "Face Recognition";
    case "fingerprint":
      return Platform.OS === "ios" ? "Touch ID" : "Fingerprint";
    default:
      return "Biometrics";
  }
}
