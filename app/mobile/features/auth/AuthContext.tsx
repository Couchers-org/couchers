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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkedAuthStatus, setCheckedAuthStatus] = useState(false);

  useEffect(() => {
    setCheckedAuthStatus(true);
  }, []);

  const markAuthenticated = useCallback(() => {
    setAuthenticated(true);
  }, []);

  const markLoggedOut = useCallback(() => {
    setAuthenticated(false);
  }, []);

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
