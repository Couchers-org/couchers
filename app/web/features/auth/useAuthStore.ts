import { Auth } from "@couchers/services";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { userKey } from "@/features/queryKeys";
import { useTranslation } from "@/i18n";
import { GLOBAL } from "@/i18n/namespaces";
import { Sentry } from "@/platform/sentry";
import { clearStorage, usePersistedState } from "@/platform/usePersistedState";
import serviceClients from "@/serviceClients";
import { useErrorMessage } from "@/utils/error";

const useAuthStore = () => {
  const [isAuthenticated, setIsAuthenticated] = usePersistedState(
    "auth.authenticated",
    false,
  );
  const [isJailed, setIsJailed] = usePersistedState("auth.jailed", false);
  const [userId, setUserId] = usePersistedState<bigint | null>(
    "auth.userId",
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [flowState, setFlowState] =
    usePersistedState<Auth.SignupFlowRes | null>("auth.flowState", null);

  // this is used to set the current user in the user cache
  // may as well not waste the api call since it is needed for userId
  const queryClient = useQueryClient();

  const { t } = useTranslation(GLOBAL);

  const { errorMessage, setError } = useErrorMessage(t);

  const authActions = useMemo(
    () => ({
      authError: setError,
      clearError: () => {
        setError(undefined);
      },
      logout: async () => {
        setError(undefined);
        setIsLoading(true);
        try {
          await serviceClients.auth.deauthenticate({});
          setIsAuthenticated(false);
          setUserId(null);
          Sentry.setUser({ id: undefined });
        } catch (e) {
          Sentry.captureException(e, {
            tags: {
              component: "auth/useAuthStore",
              action: "logout",
            },
          });
          setError(e);
        }
        clearStorage();
        setIsLoading(false);
      },
      passwordLogin: async ({
        username,
        password,
        rememberDevice,
      }: {
        username: string;
        password: string;
        rememberDevice: boolean;
      }) => {
        setError(undefined);
        setIsLoading(true);
        try {
          const auth = await serviceClients.auth.authenticate({
            user: username,
            password,
            rememberDevice,
          });
          setUserId(auth.userId);
          Sentry.setUser({ id: auth.userId.toString() });

          // this must come after setting the userId, because calling setQueryData
          // will also cause that query to be background fetched, and it needs
          // userId to be set.
          setIsJailed(auth.jailed);
          setIsAuthenticated(true);
        } catch (e) {
          Sentry.captureException(e, {
            tags: {
              component: "auth/useAuthStore",
              action: "passwordLogin",
            },
          });
          setError(e);
        }
        setIsLoading(false);
      },
      updateSignupState: (state: Auth.SignupFlowRes) => {
        setFlowState(state);
        if (state.authRes) {
          setFlowState(null);
          authActions.firstLogin(state.authRes);
          return;
        }
      },
      firstLogin: (res: Auth.AuthRes) => {
        setError(undefined);
        setUserId(res.userId);
        Sentry.setUser({ id: res.userId.toString() });
        setIsJailed(res.jailed);
        setIsAuthenticated(true);
      },
      updateJailStatus: async () => {
        setError(undefined);
        setIsLoading(true);
        try {
          const res = await serviceClients.jail.jailInfo({});

          if (!res.jailed) {
            const currentUser = (await serviceClients.api.ping({})).user;

            if (currentUser) {
              setUserId(currentUser.userId);
              Sentry.setUser({ id: currentUser.userId.toString() });
              queryClient.setQueryData(
                userKey(currentUser.userId),
                currentUser,
              );
            }
          }
          setIsJailed(res.jailed);
        } catch (e) {
          Sentry.captureException(e, {
            tags: {
              component: "auth/useAuthStore",
              action: "updateJailStatus",
            },
          });
          setError(e);
        }
        setIsLoading(false);
      },
    }),
    // note: there should be no dependenices on the state or t, or
    // some useEffects will break. Eg. the token login in Login.tsx
    [
      setError,
      setIsAuthenticated,
      setUserId,
      setIsJailed,
      setFlowState,
      queryClient,
    ],
  );

  return {
    authActions,
    authState: {
      isAuthenticated,
      error: errorMessage,
      isJailed,
      isLoading,
      userId,
      flowState,
    },
  };
};

export type AuthStoreType = ReturnType<typeof useAuthStore>;

export default useAuthStore;
