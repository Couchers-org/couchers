import { RpcError } from "grpc-web";
import React, { Context, ReactNode, useContext, useEffect } from "react";
import { setUnauthenticatedErrorHandler } from "@/service/client";

import { JAILED_ERROR_MESSAGE } from "@/features/auth/constants";
import useAuthStore, { AuthStoreType } from "@/features/auth/useAuthStore";

export const AuthContext = React.createContext<null | AuthStoreType>(null);

function useAppContext<T>(context: Context<T | null>) {
  const contextValue = useContext(context);
  if (contextValue === null) {
    throw Error("No context provided!");
  }
  return contextValue;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const store = useAuthStore();

  useEffect(() => {
    setUnauthenticatedErrorHandler(async (e: RpcError) => {
      // the backend will return "Permission denied" if you're just jailed, and "Unauthorized" otherwise
      if (e.message === JAILED_ERROR_MESSAGE) {
        await store.authActions.updateJailStatus();
      } else {
        // Session expired or unauthorized - log them out silently
        await store.authActions.logout();
        // The RootLayoutNav will automatically show the login screen
      }
    });

    return () => {
      setUnauthenticatedErrorHandler(async () => {});
    };
  }, [store.authActions]);

  return <AuthContext.Provider value={store}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => useAppContext(AuthContext);
