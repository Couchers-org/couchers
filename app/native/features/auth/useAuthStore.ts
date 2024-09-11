import Sentry from "platform/sentry";
import { userKey } from "features/queryKeys";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { AuthRes, SignupFlowRes } from "proto/auth_pb";
import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "react-query";
import { service } from "service";
import isGrpcError from "utils/isGrpcError";
import { usePersistedState } from "platform/usePersistedState";

export default function useAuthStore() {
  const [authenticated, setAuthenticated] = usePersistedState(
    "auth.authenticated",
    false,
  );
  const [jailed, setJailed] = usePersistedState("auth.jailed", false);
  const [userId, setUserId] = usePersistedState<number | null>(
    "auth.userId",
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flowState, setFlowState] =
    usePersistedState<SignupFlowRes.AsObject | null>("auth.flowState", null);

  //this is used to set the current user in the user cache
  //may as well not waste the api call since it is needed for userId
  const queryClient = useQueryClient();

  const { t } = useTranslation(GLOBAL);
  const fatalErrorMessage = useRef(t("error.fatal_message"));
  const authActions = useMemo(
    () => ({
      authError(message: string) {
        setError(message);
      },
      clearError() {
        setError(null);
      },
      async logout() {
        setError(null);
        setLoading(true);
        try {
          await service.user.logout();
          setAuthenticated(false);
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
        setLoading(false);
      },
      async passwordLogin({
        username,
        password,
        rememberDevice,
      }: {
        username: string;
        password: string;
        rememberDevice: boolean;
      }) {
        setError(null);
        setLoading(true);
        try {
          const auth = await service.user.passwordLogin(
            username,
            password,
            rememberDevice,
          );
          setUserId(auth.userId);
          Sentry.setUser({ id: auth.userId.toString() });

          //this must come after setting the userId, because calling setQueryData
          //will also cause that query to be background fetched, and it needs
          //userId to be set.
          setJailed(auth.jailed);
          setAuthenticated(true);
        } catch (e) {
          Sentry.captureException(e, {
            tags: {
              component: "auth/useAuthStore",
              action: "passwordLogin",
            },
          });
          setError(isGrpcError(e) ? e.message : fatalErrorMessage.current);
        }
        setLoading(false);
      },
      async updateSignupState(state: SignupFlowRes.AsObject) {
        setFlowState(state);
        if (state.authRes) {
          setFlowState(null);
          authActions.firstLogin(state.authRes!);
          return;
        }
      },
      async firstLogin(res: AuthRes.AsObject) {
        setError(null);
        setUserId(res.userId);
        Sentry.setUser({ id: res.userId.toString() });
        setJailed(res.jailed);
        setAuthenticated(true);
      },
      async updateJailStatus() {
        setError(null);
        setLoading(true);
        try {
          const res = await service.jail.getIsJailed();
          if (!res.isJailed) {
            setUserId(res.user.userId);
            Sentry.setUser({ id: res.user.userId.toString() });
            queryClient.setQueryData(userKey(res.user.userId), res.user);
          }
          setJailed(res.isJailed);
        } catch (e) {
          Sentry.captureException(e, {
            tags: {
              component: "auth/useAuthStore",
              action: "updateJailStatus",
            },
          });
          setError(isGrpcError(e) ? e.message : fatalErrorMessage.current);
        }
        setLoading(false);
      },
    }),
    //note: there should be no dependenices on the state or t, or
    //some useEffects will break. Eg. the token login in Login.tsx
    [setAuthenticated, setJailed, setUserId, setFlowState, queryClient],
  );

  return {
    authActions,
    authState: {
      authenticated,
      error,
      jailed,
      loading,
      userId,
      flowState,
    },
  };
}

export type AuthStoreType = ReturnType<typeof useAuthStore>;
