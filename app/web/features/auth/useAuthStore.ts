import { useQueryClient } from "@tanstack/react-query";
import { userKey } from "features/queryKeys";
import { useTranslation } from "i18n";
import { allLanguages } from "i18n/allLanguages";
import { GLOBAL } from "i18n/namespaces";
import Sentry from "platform/sentry";
import { clearStorage, usePersistedState } from "platform/usePersistedState";
import { AuthRes, SignupFlowRes } from "proto/auth_pb";
import { useMemo, useRef, useState } from "react";
import { service } from "service";
import isGrpcError from "service/utils/isGrpcError";

/**
 * Sync the NEXT_LOCALE cookie with the user's language preference from the backend
 */
async function syncLanguagePreference() {
  try {
    const accountInfo = await service.account.getAccountInfo();
    const userLanguage = accountInfo.uiLanguagePreference;

    const currentCookieLocale =
      typeof document !== "undefined"
        ? document.cookie
            .split("; ")
            .find((row) => row.startsWith("NEXT_LOCALE="))
            ?.split("=")[1]
        : null;

    // Only update cookie if user has a valid language preference and it differs from current cookie
    if (
      userLanguage &&
      allLanguages.includes(userLanguage) &&
      userLanguage !== currentCookieLocale
    ) {
      document.cookie = `NEXT_LOCALE=${userLanguage}; path=/; max-age=31536000; samesite=lax`;
    }
  } catch (e) {
    // Don't fail login if language sync fails, just log the error
    Sentry.captureException(e, {
      tags: {
        component: "auth/useAuthStore",
        action: "syncLanguagePreference",
      },
    });
  }
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
        } catch (e) {
          Sentry.captureException(e, {
            tags: {
              component: "auth/useAuthStore",
              action: "logout",
            },
          });
          setError(isGrpcError(e) ? e.message : fatalErrorMessage.current);
        }
        // Always clear local auth state even if the backend call failed
        // (e.g. session cookie not yet available in a new WebView context)
        setAuthenticated(false);
        setUserId(null);
        Sentry.setUser({ id: undefined });
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: "LOGOUT" }),
          );
        }
        clearStorage();
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

          // Sync user's language preference with NEXT_LOCALE cookie
          await syncLanguagePreference();

          setAuthenticated(true);

          // Notify mobile app that login succeeded
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: "LOGIN_SUCCESS",
                userId: auth.userId,
                jailed: auth.jailed,
              }),
            );
          }
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

        // Sync user's language preference with NEXT_LOCALE cookie
        await syncLanguagePreference();

        setAuthenticated(true);

        // Notify mobile app that signup/login succeeded
        // Note: No credentials sent here since firstLogin is called after signup flow
        // where we don't have access to the original password
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: "LOGIN_SUCCESS",
              userId: res.userId,
              jailed: res.jailed,
            }),
          );
        }
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
