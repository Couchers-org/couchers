import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthContextValue = {
  authenticated: boolean;
  checkedAuthStatus: boolean;
  markAuthenticated: () => void;
  markLoggedOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "auth.authenticated";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkedAuthStatus, setCheckedAuthStatus] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored !== null && mounted) {
          setAuthenticated(stored === "true");
        }
      } finally {
        if (mounted) {
          setCheckedAuthStatus(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback(async (value: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, value ? "true" : "false");
    } catch (error) {
      console.warn("Failed to persist auth state", error);
    }
  }, []);

  const markAuthenticated = useCallback(() => {
    setAuthenticated(true);
    persist(true);
  }, [persist]);

  const markLoggedOut = useCallback(() => {
    setAuthenticated(false);
    persist(false);
  }, [persist]);

  const value = useMemo(
    () => ({
      authenticated,
      checkedAuthStatus,
      markAuthenticated,
      markLoggedOut,
    }),
    [authenticated, checkedAuthStatus, markAuthenticated, markLoggedOut]
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
