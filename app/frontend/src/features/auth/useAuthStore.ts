import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "react-query";

import { service, SignupArguments } from "../../service";

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
        } catch (e) {
          setError(e.message);
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

          if (!auth.jailed) {
            const user = await service.user.getUser(username);
            setUserId(user.userId);
            queryClient.setQueryData(["user", user.userId], user);
          }
          //this must come after setting the userId, because calling setQueryData
          //will also cause that query to be background fetched, and it needs
          //userId to be set.
          setJailed(auth.jailed);
          setAuthenticated(true);
        } catch (e) {
          setError(e.message);
        }
        setLoading(false);
      },
      async signup(signupArguments: SignupArguments) {
        setError(null);
        setLoading(true);
        try {
          const auth = await service.user.completeSignup(signupArguments);
          if (!auth.jailed) {
            const user = await service.user.getCurrentUser();
            setUserId(user.userId);
            queryClient.setQueryData(["user", user.userId], user);
          }
          setJailed(auth.jailed);
          setAuthenticated(true);
        } catch (e) {
          setError(e.message);
        }

        setLoading(false);
      },
      async tokenLogin(loginToken: string) {
        setError(null);
        setLoading(true);
        try {
          const auth = await service.user.tokenLogin(loginToken);

          if (!auth.jailed) {
            const user = await service.user.getCurrentUser();
            setUserId(user.userId);
            queryClient.setQueryData(["user", user.userId], user);
          }
          setJailed(auth.jailed);
          setAuthenticated(true);
        } catch (e) {
          setError(e.message);
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
            queryClient.setQueryData(["user", res.user.userId], res.user);
          }
          setJailed(res.isJailed);
        } catch (e) {
          setError(e.message);
        }
        setLoading(false);
      },
    }),
    //note: there should be no dependenices on the state, or
    //some useEffects will break. Eg. the token login in Login.tsx
    [setAuthenticated, setJailed, setUserId, queryClient]
  );

  return {
    authActions,
    authState: {
      authenticated,
      error,
      jailed,
      loading,
      userId,
    },
  };
}

export type AuthStoreType = ReturnType<typeof useAuthStore>;
