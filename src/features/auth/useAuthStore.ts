import * as Sentry from "@sentry/react";
import { ERROR_INFO_FATAL } from "components/ErrorFallback/constants";
import { AuthRes, SignupFlowRes } from "proto/auth_pb";
import { userKey } from "queryKeys";
import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "react-query";
import isGrpcError from "utils/isGrpcError";

import { service } from "../../service";

export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const saved = window.localStorage.getItem(key);
  const [_state, _setState] = useState<T>(
    saved !== null ? JSON.parse(saved) : defaultValue
  );
  const setState = useCallback(
    (value: T) => {
      if (value === undefined) {
        console.warn(`${key} can't be stored as undefined, casting to null.`);
      }
      const v = value === undefined ? null : value;
      window.localStorage.setItem(key, JSON.stringify(v));
      _setState(value);
    },
    [key]
  );
  return [_state, setState];
}

export default function useAuthStore() {
  const [authenticated, setAuthenticated] = usePersistedState(
    "auth.authenticated",
    false
  );
  const [jailed, setJailed] = usePersistedState("auth.jailed", false);
  const [userId, setUserId] = usePersistedState<number | null>(
    "auth.userId",
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flowState, setFlowState] =
    usePersistedState<SignupFlowRes.AsObject | null>("auth.flowState", null);

  //this is used to set the current user in the user cache
  //may as well not waste the api call since it is needed for userId
  const queryClient = useQueryClient();

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
          setError(isGrpcError(e) ? e.message : ERROR_INFO_FATAL);
        }
        setLoading(false);
      },
      async passwordLogin({
        username,
        password,
      }: {
        username: string;
        password: string;
      }) {
        setError(null);
        setLoading(true);
        try {
          const auth = await service.user.passwordLogin(username, password);
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
          setError(isGrpcError(e) ? e.message : ERROR_INFO_FATAL);
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
      async tokenLogin(loginToken: string) {
        setError(null);
        setLoading(true);
        try {
          const auth = await service.user.tokenLogin(loginToken);
          setUserId(auth.userId);
          Sentry.setUser({ id: auth.userId.toString() });
          setJailed(auth.jailed);
          setAuthenticated(true);
        } catch (e) {
          Sentry.captureException(e, {
            tags: {
              component: "auth/useAuthStore",
              action: "tokenLogin",
            },
          });
          setError(isGrpcError(e) ? e.message : ERROR_INFO_FATAL);
        }
        setLoading(false);
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
          setError(isGrpcError(e) ? e.message : ERROR_INFO_FATAL);
        }
        setLoading(false);
      },
    }),
    //note: there should be no dependenices on the state, or
    //some useEffects will break. Eg. the token login in Login.tsx
    [setAuthenticated, setJailed, setUserId, setFlowState, queryClient]
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
