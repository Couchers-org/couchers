import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sentry from "@sentry/react-native";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

type StoredAuthState = { userId: number | null; jailed: boolean };

export const LAST_AUTH_STATE_KEY = "@couchers/lastAuthState";

async function readStoredAuthState(): Promise<StoredAuthState | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_AUTH_STATE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuthState) : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkedAuthStatus, setCheckedAuthStatus] = useState(false);
  const [userId, setUserIdState] = useState<number | null>(null);
  const [jailed, setJailedState] = useState(false);
  // Mirrors authenticated synchronously so markLoggedOut can deduplicate
  // concurrent LOGOUT messages from multiple mounted WebEmbed instances.
  // useState is async (batched renders), so a ref is needed here.
  const isAuthenticatedRef = useRef(false);

  // On mount, show the last known auth state straight away (so the app opens
  // offline), then validate the session cookie with the backend.
  useEffect(() => {
    async function checkAuthStatus() {
      const stored = await readStoredAuthState();
      if (stored) {
        setUserIdState(stored.userId);
        setJailedState(stored.jailed);
        isAuthenticatedRef.current = true;
        setAuthenticated(true);
        setCheckedAuthStatus(true);
      }

      try {
        // Call backend to check if session cookie is still valid
        const response = await client.auth.getAuthState(new Empty());
        const authState = response.toObject();

        if (authState.loggedIn && authState.authRes) {
          // Session is valid - authenticate directly
          setUserIdState(authState.authRes.userId);
          setJailedState(authState.authRes.jailed);
          isAuthenticatedRef.current = true;
          setAuthenticated(true);
        } else {
          // Not logged in
          isAuthenticatedRef.current = false;
          setAuthenticated(false);
          setUserIdState(null);
          setJailedState(false);
        }
      } catch (error) {
        // Couldn't reach the backend: keep the stored state, or show login if there is none
        if (__DEV__) {
          console.error("Error checking auth status:", error);
        }
      } finally {
        setCheckedAuthStatus(true);
      }
    }

    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (!checkedAuthStatus) return;
    if (authenticated) {
      void AsyncStorage.setItem(
        LAST_AUTH_STATE_KEY,
        JSON.stringify({ userId, jailed } satisfies StoredAuthState),
      );
    } else {
      void AsyncStorage.removeItem(LAST_AUTH_STATE_KEY);
    }
  }, [checkedAuthStatus, authenticated, userId, jailed]);

  useEffect(() => {
    Sentry.setUser(userId === null ? null : { id: String(userId) });
  }, [userId]);

  const markAuthenticated = useCallback(() => {
    isAuthenticatedRef.current = true;
    setAuthenticated(true);
  }, []);

  const markLoggedOut = useCallback(async () => {
    // Guard against concurrent LOGOUT messages from multiple mounted WebEmbed
    // instances (one per tab). Only the first call does anything; setState is
    // async so subsequent calls would still see the old value without this ref.
    if (!isAuthenticatedRef.current) return;
    isAuthenticatedRef.current = false;
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
