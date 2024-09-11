import { Alert } from "react-native";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import React, { Context, ReactNode, useContext, useEffect } from "react";
import { setUnauthenticatedErrorHandler } from "service/client";

import { JAILED_ERROR_MESSAGE } from "./constants";
import useAuthStore, { AuthStoreType } from "./useAuthStore";

export const AuthContext = React.createContext<null | AuthStoreType>(null);

function useAppContext<T>(context: Context<T | null>) {
  const contextValue = useContext(context);
  if (contextValue === null) {
    throw Error("No context provided!");
  }
  return contextValue;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation(AUTH);
  const store = useAuthStore();

  useEffect(() => {
    setUnauthenticatedErrorHandler(async (e: RpcError) => {
      // the backend will return "Permission denied" if you're just jailed, and "Unauthorized" otherwise
      if (e.message === JAILED_ERROR_MESSAGE) {
        await store.authActions.updateJailStatus();
        Alert.alert("You seem to be jailed.");
      } else {
        // completely logged out
        await store.authActions.logout();
        store.authActions.authError(t("logged_out_message"));
        Alert.alert("You've been logged out.");
      }
    });

    return () => {
      setUnauthenticatedErrorHandler(async () => {});
    };
  }, [store.authActions, t]);

  return <AuthContext.Provider value={store}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => useAppContext(AuthContext);
