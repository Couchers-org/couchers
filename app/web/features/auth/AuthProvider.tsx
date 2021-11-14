import { Error as GrpcError } from "grpc-web";
import { useRouter } from "next/dist/client/router";
import React, { Context, ReactNode, useContext, useEffect } from "react";

import { jailRoute, loginRoute } from "../../routes";
import { setUnauthenticatedErrorHandler } from "../../service/client";
import { JAILED_ERROR_MESSAGE, YOU_WERE_LOGGED_OUT } from "./constants";
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
  const store = useAuthStore();

  const router = useRouter();

  useEffect(() => {
    setUnauthenticatedErrorHandler(async (e: GrpcError) => {
      // the backend will return "Permission denied" if you're just jailed, and "Unauthorized" otherwise
      if (e.message === JAILED_ERROR_MESSAGE) {
        await store.authActions.updateJailStatus();
        router.push(jailRoute);
      } else {
        // completely logged out
        await store.authActions.logout();
        store.authActions.authError(YOU_WERE_LOGGED_OUT);
        router.push(loginRoute);
      }
    });

    return () => {
      setUnauthenticatedErrorHandler(async () => {});
    };
  }, [store.authActions, router]);

  return <AuthContext.Provider value={store}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => useAppContext(AuthContext);
