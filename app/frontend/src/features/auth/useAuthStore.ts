import { useRef, useState } from "react";
import { User } from "../../pb/api_pb";
import { service, SignupArguments } from "../../service";
import {
  HostingPreferenceData,
  UpdateUserProfileData,
} from "../../service/user";

export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const saved = window.localStorage.getItem(key);
  const [_state, _setState] = useState<T>(
    saved !== null ? JSON.parse(saved) : defaultValue
  );
  const setState = (value: T) => {
    window.localStorage.setItem(key, JSON.stringify(value));
    _setState(value);
  };
  return [_state, setState];
}

export default function useAuthStore() {
  const [authenticated, setAuthenticated] = usePersistedState(
    "auth.authenticated",
    false
  );
  const [jailed, setJailed] = usePersistedState("auth.jailed", false);
  const [user, setUser] = usePersistedState<User.AsObject | null>(
    "auth.user",
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //useRef provides referential equality between renders
  //(setState functions remain consistent)
  const { current: authActions } = useRef({
    clearError() {
      setError(null);
    },
    authError(message: string) {
      setError(message);
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
        setJailed(auth.jailed);

        if (!auth.jailed) {
          const user = await service.user.getUser(username);
          setUser(user);
        }
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
        setJailed(auth.jailed);

        if (!auth.jailed) {
          const user = await service.user.getCurrentUser();
          setUser(user);
        }

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
        setJailed(auth.jailed);

        if (!auth.jailed) {
          const user = await service.user.getCurrentUser();
          setUser(user);
        }
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
        const isJailed = (await service.jail.getIsJailed()).isJailed;
        setJailed(isJailed);
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    },
    async logout() {
      setError(null);
      setLoading(true);
      try {
        service.user.logout();
        setUser(null);
        setAuthenticated(false);
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    },
    async updateUserProfile(userData: UpdateUserProfileData) {
      const username = user?.username;

      if (!username) {
        throw Error("User is not connected.");
      }

      await service.user.updateProfile(userData);

      setUser(await service.user.getUser(username));
    },
    async updateHostingPreferences(preferences: HostingPreferenceData) {
      const username = user?.username;

      if (!username) {
        throw Error("User is not connected.");
      }

      await service.user.updateHostingPreference(preferences);

      setUser(await service.user.getUser(username));
    },
  });

  return {
    authState: {
      authenticated,
      jailed,
      user,
      loading,
      error,
    },
    authActions,
  };
}

export type AuthStoreType = ReturnType<typeof useAuthStore>;
