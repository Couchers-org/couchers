import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import * as SecureStore from "expo-secure-store";

import client from "@/service/client";
import i18n from "@/i18n";

const BIOMETRICS_ENABLED_KEY = "biometrics_enabled";

// Lazy import LocalAuthentication to handle Expo Go gracefully
let LocalAuthentication: typeof import("expo-local-authentication") | null =
  null;

async function getLocalAuthentication() {
  if (LocalAuthentication) return LocalAuthentication;
  try {
    LocalAuthentication = await import("expo-local-authentication");
    // Test if native module is available
    await LocalAuthentication.hasHardwareAsync();
    return LocalAuthentication;
  } catch {
    // Native module not available (e.g., running in Expo Go)
    return null;
  }
}

type AuthContextValue = {
  authenticated: boolean;
  checkedAuthStatus: boolean;
  userId: number | null;
  jailed: boolean;
  /** Whether biometrics are enabled for this app */
  biometricsEnabled: boolean;
  /** Whether biometrics are available (native module loaded) */
  biometricsAvailable: boolean;
  markAuthenticated: () => void;
  markLoggedOut: () => void;
  setUserId: (id: number | null) => void;
  setJailed: (jailed: boolean) => void;
  /** Enable biometrics for quick login */
  enableBiometrics: () => Promise<void>;
  /** Disable biometrics */
  disableBiometrics: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkedAuthStatus, setCheckedAuthStatus] = useState(false);
  const [userId, setUserIdState] = useState<number | null>(null);
  const [jailed, setJailedState] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  // Check auth status on mount - validates session cookie with backend
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        // Check if biometrics are enabled (stored preference)
        const storedBiometrics = await SecureStore.getItemAsync(
          BIOMETRICS_ENABLED_KEY,
        );
        const biometricsEnabledPref = storedBiometrics === "true";
        setBiometricsEnabled(biometricsEnabledPref);

        // Check if LocalAuthentication native module is available
        const localAuth = await getLocalAuthentication();
        const isNativeModuleAvailable = localAuth !== null;
        setBiometricsAvailable(isNativeModuleAvailable);

        // Call backend to check if session cookie is still valid
        const response = await client.auth.getAuthState(new Empty());
        const authState = response.toObject();

        if (authState.loggedIn && authState.authRes) {
          // Session is valid - check if we need biometric auth
          if (biometricsEnabledPref && localAuth) {
            // Check if biometrics are available on device
            const [hasHardware, isEnrolled] = await Promise.all([
              localAuth.hasHardwareAsync(),
              localAuth.isEnrolledAsync(),
            ]);

            if (hasHardware && isEnrolled) {
              // Prompt for biometric authentication
              const biometricResult = await localAuth.authenticateAsync({
                promptMessage: i18n.t("biometrics.login_prompt"),
                cancelLabel: i18n.t("biometrics.use_password_button"),
                disableDeviceFallback: false,
              });

              if (biometricResult.success) {
                // Biometric auth succeeded - set authenticated state
                setUserIdState(authState.authRes.userId);
                setJailedState(authState.authRes.jailed);
                setAuthenticated(true);
              }
              // If biometric fails, user will see login screen
            } else {
              // Biometrics not available on device - disable the setting
              await SecureStore.deleteItemAsync(BIOMETRICS_ENABLED_KEY);
              setBiometricsEnabled(false);
              // Still authenticate since session is valid
              setUserIdState(authState.authRes.userId);
              setJailedState(authState.authRes.jailed);
              setAuthenticated(true);
            }
          } else {
            // Biometrics not enabled - just authenticate with valid session
            setUserIdState(authState.authRes.userId);
            setJailedState(authState.authRes.jailed);
            setAuthenticated(true);
          }
        }
        // If not logged in, authenticated stays false and user sees login screen
      } catch (error) {
        // Network error or session invalid - user will see login screen
        if (__DEV__) {
          console.error("Error checking auth status:", error);
        }
      } finally {
        setCheckedAuthStatus(true);
      }
    }

    checkAuthStatus();
  }, []);

  const markAuthenticated = useCallback(() => {
    setAuthenticated(true);
  }, []);

  const markLoggedOut = useCallback(() => {
    setAuthenticated(false);
    setUserIdState(null);
    setJailedState(false);
  }, []);

  const setUserId = useCallback((id: number | null) => {
    setUserIdState(id);
  }, []);

  const setJailed = useCallback((jailed: boolean) => {
    setJailedState(jailed);
  }, []);

  const enableBiometrics = useCallback(async () => {
    await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, "true");
    setBiometricsEnabled(true);
  }, []);

  const disableBiometrics = useCallback(async () => {
    await SecureStore.deleteItemAsync(BIOMETRICS_ENABLED_KEY);
    setBiometricsEnabled(false);
  }, []);

  const value = useMemo(
    () => ({
      authenticated,
      checkedAuthStatus,
      userId,
      jailed,
      biometricsEnabled,
      biometricsAvailable,
      markAuthenticated,
      markLoggedOut,
      setUserId,
      setJailed,
      enableBiometrics,
      disableBiometrics,
    }),
    [
      authenticated,
      checkedAuthStatus,
      userId,
      jailed,
      biometricsEnabled,
      biometricsAvailable,
      markAuthenticated,
      markLoggedOut,
      setUserId,
      setJailed,
      enableBiometrics,
      disableBiometrics,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
