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

import client from "@/service/client";

type AuthContextValue = {
  authenticated: boolean;
  checkedAuthStatus: boolean;
  userId: number | null;
  jailed: boolean;
  markAuthenticated: () => void;
  markLoggedOut: () => Promise<void>;
  setUserId: (id: number | null) => void;
  setJailed: (jailed: boolean) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkedAuthStatus, setCheckedAuthStatus] = useState(false);
  const [userId, setUserIdState] = useState<number | null>(null);
  const [jailed, setJailedState] = useState(false);

  // Check auth status on mount - validates session cookie with backend
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        // Call backend to check if session cookie is still valid
        const response = await client.auth.getAuthState(new Empty());
        const authState = response.toObject();

        if (authState.loggedIn && authState.authRes) {
          // Session is valid - authenticate directly
          setUserIdState(authState.authRes.userId);
          setJailedState(authState.authRes.jailed);
          setAuthenticated(true);
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

  const value = useMemo(
    () => ({
      authenticated,
      checkedAuthStatus,
      userId,
      jailed,
      markAuthenticated,
      markLoggedOut,
      setUserId,
      setJailed,
    }),
    [
      authenticated,
      checkedAuthStatus,
      userId,
      jailed,
      markAuthenticated,
      markLoggedOut,
      setUserId,
      setJailed,
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
