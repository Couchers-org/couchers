import React, { Context, ReactChild, useContext, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { loginRoute } from "../../AppRoutes";
import { setUnauthenticatedErrorHandler } from "../../service/client";
import useAuthStore, { AuthStoreType } from "./useAuthStore";

export const AuthContext = React.createContext<null | AuthStoreType>(null);

function useAppContext<T>(context: Context<T | null>) {
  const contextValue = useContext(context);
  if (contextValue === null) {
    throw Error("No context provided!");
  }
  return contextValue;
}

export default function AuthProvider({ children }: { children: ReactChild }) {
  const store = useAuthStore();

  const history = useHistory();

  useEffect(() =>
    setUnauthenticatedErrorHandler(() => {
      store.authActions.logout();
      store.authActions.authError("You were logged out.");
      history.push(loginRoute);
    })
  );

  return <AuthContext.Provider value={store}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => useAppContext(AuthContext);
