import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";

import { userKey } from "@/features/queryKeys";
import { useTranslation } from "@/i18n";
import { GLOBAL } from "@/i18n/namespaces";
import { Sentry } from "@/platform/sentry";
import { clearStorage, usePersistedState } from "@/platform/usePersistedState";
import { AuthRes, SignupFlowRes } from "@/proto/auth_pb";
import { service } from "@/service";
import isGrpcError from "@/service/utils/isGrpcError";

const useAuthStore = () => {
  const [isAuthenticated, setIsAuthenticated] = usePersistedState(
    "auth.authenticated",
    false,
  );
  const [isJailed, setIsJailed] = usePersistedState("auth.jailed", false);
  const [userId, setUserId] = usePersistedState<number | null>(
    "auth.userId",
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flowState, setFlowState] =
    usePersistedState<SignupFlowRes.AsObject | null>("auth.flowState", null);

  // this is used to set the current user in the user cache
  // may as well not waste the api call since it is needed for userId
  const queryClient = useQueryClient();

  const { t } = useTranslation(GLOBAL);
  const fatalErrorMessage = useRef(t("error.fatal_message"));
  const authActions = useMemo(
    () => ({
      authError: (message: string) => {
        setError(message);
      },
      clearError: () => {
        setError(null);
      },
      logout: async () => {
        setError(null);
        setIsLoading(true);
        try {
          await service.user.logout();
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
          setError(isGrpcError(e) ? e.message : fatalErrorMessage.current);
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
        setError(null);
        setIsLoading(true);
        try {
          const auth = await service.user.passwordLogin(
            username,
            password,
            rememberDevice,
          );
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
          setError(isGrpcError(e) ? e.message : fatalErrorMessage.current);
        }
        setIsLoading(false);
      },
      updateSignupState: (state: SignupFlowRes.AsObject) => {
        setFlowState(state);
        if (state.authRes) {
          setFlowState(null);
          authActions.firstLogin(state.authRes);
          return;
        }
      },
      firstLogin: (res: AuthRes.AsObject) => {
        setError(null);
        setUserId(res.userId);
        Sentry.setUser({ id: res.userId.toString() });
        setIsJailed(res.jailed);
        setIsAuthenticated(true);
      },
      updateJailStatus: async () => {
        setError(null);
        setIsLoading(true);
        try {
          const res = await service.jail.getIsJailed();
          if (!res.isJailed) {
            setUserId(res.user.userId);
            Sentry.setUser({ id: res.user.userId.toString() });
            queryClient.setQueryData(userKey(res.user.userId), res.user);
          }
          setIsJailed(res.isJailed);
        } catch (e) {
          Sentry.captureException(e, {
            tags: {
              component: "auth/useAuthStore",
              action: "updateJailStatus",
            },
          });
          setError(isGrpcError(e) ? e.message : fatalErrorMessage.current);
        }
        setIsLoading(false);
      },
    }),
    // note: there should be no dependenices on the state or t, or
    // some useEffects will break. Eg. the token login in Login.tsx
    [setIsAuthenticated, setIsJailed, setUserId, setFlowState, queryClient],
  );

  return {
    authActions,
    authState: {
      isAuthenticated,
      error,
      isJailed,
      isLoading,
      userId,
      flowState,
    },
  };
};

export type AuthStoreType = ReturnType<typeof useAuthStore>;

export default useAuthStore;
