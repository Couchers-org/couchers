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
const SECURE_LOGIN_ENABLED_KEY = "secure_login_enabled";

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
  /** Whether any local auth (biometrics or device credentials) is enabled */
  secureLoginEnabled: boolean;
  /** Whether biometrics are available (native module loaded) */
  biometricsAvailable: boolean;
  markAuthenticated: () => void;
  markLoggedOut: () => Promise<void>;
  setUserId: (id: number | null) => void;
  setJailed: (jailed: boolean) => void;
  /** Enable biometrics for quick login */
  enableBiometrics: () => Promise<void>;
  /** Enable secure login using device credentials (PIN/pattern/passcode) */
  enableSecureLogin: () => Promise<void>;
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
  const [secureLoginEnabled, setSecureLoginEnabled] = useState(false);

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
        const storedSecureLogin = await SecureStore.getItemAsync(
          SECURE_LOGIN_ENABLED_KEY,
        );
        const secureLoginPref = storedSecureLogin === "true";
        setSecureLoginEnabled(secureLoginPref);

        // Check if LocalAuthentication native module is available
        const localAuth = await getLocalAuthentication();
        const isNativeModuleAvailable = localAuth !== null;
        setBiometricsAvailable(isNativeModuleAvailable);

        // Call backend to check if session cookie is still valid
        const response = await client.auth.getAuthState(new Empty());
        const authState = response.toObject();

        if (authState.loggedIn && authState.authRes) {
          // Session is valid - check if we need local auth
          if ((secureLoginPref || biometricsEnabledPref) && localAuth) {
            // Check if biometrics or device credentials are available on device
            const [isEnrolled, supportedAuthTypes, enrolledLevel] =
              await Promise.all([
                localAuth.isEnrolledAsync(),
                localAuth.supportedAuthenticationTypesAsync(),
                localAuth.getEnrolledLevelAsync(),
              ]);

            const hasAnyBiometric =
              supportedAuthTypes.length > 0 &&
              enrolledLevel !== localAuth.SecurityLevel.NONE;
            // Use a neutral prompt when biometrics are available; PIN-specific when not
            const promptMessage = hasAnyBiometric
              ? i18n.t("biometrics.login_prompt")
              : i18n.t("biometrics.pin_prompt");
            const fallbackLabel = i18n.t("biometrics.pin_fallback_label");
            const promptDescription = undefined;
            const promptSubtitle = undefined;

            if (isEnrolled || enrolledLevel !== localAuth.SecurityLevel.NONE) {
              // Prompt for biometric authentication
              const biometricResult = await localAuth.authenticateAsync({
                promptMessage,
                cancelLabel: i18n.t("biometrics.use_password_button"),
                fallbackLabel,
                promptDescription,
                promptSubtitle,
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
        } else {
          // Not logged in
          setAuthenticated(false);
          setUserIdState(null);
          setJailedState(false);
        }
      } catch (error) {
        // Network error - user must log in again
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

  const markLoggedOut = useCallback(async () => {
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
    await SecureStore.setItemAsync(SECURE_LOGIN_ENABLED_KEY, "true");
    await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, "true");
    setBiometricsEnabled(true);
    setSecureLoginEnabled(true);
  }, []);

  const enableSecureLogin = useCallback(async () => {
    await SecureStore.setItemAsync(SECURE_LOGIN_ENABLED_KEY, "true");
    setSecureLoginEnabled(true);
  }, []);

  const disableBiometrics = useCallback(async () => {
    await SecureStore.deleteItemAsync(BIOMETRICS_ENABLED_KEY);
    await SecureStore.deleteItemAsync(SECURE_LOGIN_ENABLED_KEY);
    setBiometricsEnabled(false);
    setSecureLoginEnabled(false);
  }, []);

  const value = useMemo(
    () => ({
      authenticated,
      checkedAuthStatus,
      userId,
      jailed,
      biometricsEnabled,
      secureLoginEnabled,
      biometricsAvailable,
      markAuthenticated,
      markLoggedOut,
      setUserId,
      setJailed,
      enableBiometrics,
      enableSecureLogin,
      disableBiometrics,
    }),
    [
      authenticated,
      checkedAuthStatus,
      userId,
      jailed,
      biometricsEnabled,
      secureLoginEnabled,
      biometricsAvailable,
      markAuthenticated,
      markLoggedOut,
      setUserId,
      setJailed,
      enableBiometrics,
      enableSecureLogin,
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
