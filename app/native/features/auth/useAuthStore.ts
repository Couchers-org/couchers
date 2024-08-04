// import * as Sentry from "@sentry/nextjs";
import { userKey } from "features/queryKeys";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { AuthRes, SignupFlowRes } from "proto/auth_pb";
import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { useQueryClient } from "react-query";
import { service } from "service";
import isGrpcError from "utils/isGrpcError";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function usePersistedState<T>(
  key: string,
  defaultValue: T,
): [T | undefined, (value: T) => Promise<void>, () => Promise<void>] {
  const [_state, _setState] = useState<T | undefined>(undefined);

  useEffect(() => {
    // Load the saved value from AsyncStorage when the component mounts
    const loadState = async () => {
      try {
        const savedValue = await AsyncStorage.getItem(key);
        if (savedValue !== null) {
          _setState(JSON.parse(savedValue));
        } else {
          _setState(defaultValue);
        }
      } catch (error) {
        console.error("Failed to load the state from AsyncStorage:", error);
        _setState(defaultValue);
      }
    };

    loadState();
  }, [key, defaultValue]);

  const setState = useCallback(
    async (value: T) => {
      try {
        if (value === undefined) {
          console.warn(`${key} can't be stored as undefined, casting to null.`);
        }
        const v = value === undefined ? null : value;
        await AsyncStorage.setItem(key, JSON.stringify(v));
        _setState(value);
      } catch (error) {
        console.error("Failed to save the state to AsyncStorage:", error);
      }
    },
    [key],
  );

  const clearState = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(key);
      _setState(undefined);
    } catch (error) {
      console.error("Failed to clear the state from AsyncStorage:", error);
    }
  }, [key]);

  return [_state, setState, clearState];
}

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
          // Sentry.setUser({ id: undefined });
        } catch (e) {
          // Sentry.captureException(e, {
          //   tags: {
          //     component: "auth/useAuthStore",
          //     action: "logout",
          //   },
          // });
          setError(isGrpcError(e) ? e.message : fatalErrorMessage.current);
        }
        // window.sessionStorage.clear();
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
          // Sentry.setUser({ id: auth.userId.toString() });

          //this must come after setting the userId, because calling setQueryData
          //will also cause that query to be background fetched, and it needs
          //userId to be set.
          setJailed(auth.jailed);
          setAuthenticated(true);
        } catch (e) {
          // Sentry.captureException(e, {
          //   tags: {
          //     component: "auth/useAuthStore",
          //     action: "passwordLogin",
          //   },
          // });
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
        // Sentry.setUser({ id: res.userId.toString() });
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
            // Sentry.setUser({ id: res.user.userId.toString() });
            queryClient.setQueryData(userKey(res.user.userId), res.user);
          }
          setJailed(res.isJailed);
        } catch (e) {
          // Sentry.captureException(e, {
          //   tags: {
          //     component: "auth/useAuthStore",
          //     action: "updateJailStatus",
          //   },
          // });
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
