import { useRouter } from "next/router";
import React, { Context, ReactNode, useContext, useEffect } from "react";

import { useTranslation } from "@/i18n";
import { AUTH } from "@/i18n/namespaces";
import { JAIL_ROUTE, LOGIN_ROUTE } from "@/routes";
import { setUnauthenticatedCallback } from "@/serviceClients";
import { emptyAsyncFunction } from "@/utils/function";
import useStablePush from "@/utils/useStablePush";

import useAuthStore, { AuthStoreType } from "./useAuthStore";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const AuthContext = React.createContext<null | AuthStoreType>(null);

const useAppContext = <T,>(context: Context<T | null>) => {
  const contextValue = useContext(context);
  if (contextValue === null) {
    throw Error("No context provided!");
  }
  return contextValue;
};

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation(AUTH);
  const store = useAuthStore();
  const router = useRouter();

  const push = useStablePush();

  useEffect(() => {
    setUnauthenticatedCallback(async (isJailed) => {
      if (isJailed) {
        const isJailRouteException = router.pathname.includes("delete-account");

        await store.authActions.updateJailStatus();

        if (!isJailRouteException) {
          // if the user is jailed, redirect them to the jail route
          await push(JAIL_ROUTE);
        }
      } else {
        // completely logged out
        await store.authActions.logout();
        store.authActions.authError(t("logged_out_message"));
        await push(LOGIN_ROUTE);
      }
    });

    return () => {
      setUnauthenticatedCallback(emptyAsyncFunction);
    };
  }, [store.authActions, push, t, router.pathname]);

  return <AuthContext.Provider value={store}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => useAppContext(AuthContext);

export default AuthProvider;
